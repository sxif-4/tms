import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { isSameUtcDay, toDateKey } from '../../shared/utils/park-date';
import { EventSchedulesRepository } from '../event-schedules/event-schedules.repository';
import { EventsRepository } from '../events/events.repository';
import { ParkTicketsRepository } from '../park-tickets/park-tickets.repository';
import { CreateEventBookingDto } from './dto/create-event-booking.dto';
import { StaffEventBookingDto } from './dto/staff-event-booking.dto';
import { UpdateEventBookingStatusDto } from './dto/update-event-booking-status.dto';
import {
  EventBookingsRepository,
  type EventBookingFilters,
  type EventBookingRow,
} from './event-bookings.repository';

const ref = () => `EB-${randomUUID().slice(0, 8).toUpperCase()}`;

@Injectable()
export class EventBookingsService {
  constructor(
    private readonly bookingsRepo: EventBookingsRepository,
    private readonly schedulesRepo: EventSchedulesRepository,
    private readonly eventsRepo: EventsRepository,
    private readonly ticketsRepo: ParkTicketsRepository,
    private readonly audit: AuditService,
  ) {}

  listAll(filters: EventBookingFilters): Promise<EventBookingRow[]> {
    return this.bookingsRepo.findAll(filters);
  }

  async findById(id: number): Promise<EventBookingRow> {
    const booking = await this.bookingsRepo.findRowById(id);
    if (!booking) throw new NotFoundException(`Event booking #${id} not found`);
    return booking;
  }

  getMine(userId: number): Promise<EventBookingRow[]> {
    return this.bookingsRepo.findByUserId(userId);
  }

  /**
   * The park's cross-domain prerequisite — the counterpart of "a ferry booking
   * needs a hotel booking". The FK on `park_ticket_id` only proves *a* ticket
   * exists; the four checks below are what prove it's the *right* one.
   */
  async create(
    user: AuthenticatedUser,
    dto: CreateEventBookingDto,
  ): Promise<EventBookingRow> {
    const schedule = await this.schedulesRepo.findRowById(dto.eventScheduleId);
    if (!schedule) {
      throw new NotFoundException(
        `Event schedule #${dto.eventScheduleId} not found`,
      );
    }

    const ticket = await this.ticketsRepo.findById(dto.parkTicketId);
    if (!ticket) {
      throw new NotFoundException(`Park ticket #${dto.parkTicketId} not found`);
    }

    // 1. The ticket must be the caller's. Without this, anyone could pass a
    //    stranger's ticket id and ride on it. This is the one check the desk
    //    flow drops — see `createForStaff`.
    if (ticket.userId !== user.id) {
      throw new ForbiddenException('That park ticket belongs to someone else');
    }

    return this.bookSeats({
      schedule,
      ticket,
      quantity: dto.quantity,
      actorId: user.id,
      channel: 'online',
    });
  }

  /**
   * Desk booking: park staff seat a guest who is standing in front of them
   * holding a printed ticket. Ownership is not checked — possession of the
   * ticket is the proof, exactly as it is at the gate — but every other rule
   * is identical, because it runs through the same `bookSeats`.
   *
   * The booking belongs to the ticket's owner, never the staff member. Getting
   * that backwards would put staff accounts in customer booking lists and
   * corrupt every per-visitor report (the same trap `gateSale` avoids).
   */
  async createForStaff(
    staff: AuthenticatedUser,
    dto: StaffEventBookingDto,
  ): Promise<EventBookingRow> {
    const schedule = await this.schedulesRepo.findRowById(dto.eventScheduleId);
    if (!schedule) {
      throw new NotFoundException(
        `Event schedule #${dto.eventScheduleId} not found`,
      );
    }

    const ticket = await this.ticketsRepo.findRowByReference(
      dto.ticketReference.trim(),
    );
    if (!ticket) {
      throw new NotFoundException('No ticket with that reference');
    }

    return this.bookSeats({
      schedule,
      ticket,
      quantity: dto.quantity,
      actorId: ticket.userId,
      channel: 'desk',
      soldByUserId: staff.id,
    });
  }

  /**
   * Everything both entry points share: the remaining prerequisite checks,
   * capacity, the price snapshot, the mock payment and the audit record.
   * Keeping one path means the desk flow can never drift from the rules the
   * visitor flow enforces.
   */
  private async bookSeats(input: {
    schedule: {
      id: number;
      eventId: number;
      startAt: Date;
      capacity: number;
      booked: number;
    };
    ticket: {
      id: number;
      userId: number;
      status: string;
      visitDate: Date;
      quantity: number;
    };
    quantity: number;
    /** Who the booking belongs to — always the ticket holder. */
    actorId: number;
    channel: 'online' | 'desk';
    /** The staff member who took a desk booking, for the audit trail. */
    soldByUserId?: number;
  }): Promise<EventBookingRow> {
    const { schedule, ticket, quantity } = input;

    // 2. A used, cancelled or refunded ticket buys nothing.
    if (ticket.status !== 'active') {
      throw new BadRequestException(`Your park ticket is ${ticket.status}`);
    }
    // 3. A Monday ticket cannot get you into a Tuesday show.
    if (!isSameUtcDay(ticket.visitDate, schedule.startAt)) {
      throw new BadRequestException(
        `Your park ticket is for ${toDateKey(ticket.visitDate)}, but this event runs on ${toDateKey(schedule.startAt)}`,
      );
    }
    // 4. A 2-person ticket cannot book 5 event seats. Checked per booking, not
    //    cumulatively — the same two people may attend several events.
    if (quantity > ticket.quantity) {
      throw new BadRequestException(
        `Your park ticket covers ${ticket.quantity} visitor(s), so you cannot book ${quantity} seat(s)`,
      );
    }

    const remaining = Math.max(0, schedule.capacity - schedule.booked);
    if (quantity > remaining) {
      throw new ConflictException(
        `Only ${remaining} seat(s) left on this schedule`,
      );
    }

    const event = await this.eventsRepo.findById(schedule.eventId);
    if (!event) {
      throw new NotFoundException(`Event #${schedule.eventId} not found`);
    }

    // Price snapshot at booking time — never re-derived from base_price later.
    const totalAmount = (Number(event.basePrice) * quantity).toFixed(2);

    const booking = await this.bookingsRepo.create({
      bookingReference: ref(),
      userId: input.actorId,
      eventScheduleId: schedule.id,
      parkTicketId: ticket.id,
      quantity,
      totalAmount,
      status: 'confirmed',
    });

    await this.bookingsRepo.recordMockPayment({
      userId: input.actorId,
      payableId: booking.id,
      amount: totalAmount,
      method: input.channel === 'desk' ? 'cash' : 'card',
    });

    await this.audit.record({
      // Attribute the action to whoever performed it: the staff member at the
      // desk, or the visitor themselves online.
      userId: input.soldByUserId ?? input.actorId,
      action: AuditAction.EventBookingCreated,
      subjectType: 'EventBooking',
      subjectId: booking.id,
      metadata: {
        bookingReference: booking.bookingReference,
        eventScheduleId: schedule.id,
        parkTicketId: ticket.id,
        quantity,
        totalAmount,
        channel: input.channel,
        ...(input.soldByUserId ? { soldByUserId: input.soldByUserId } : {}),
      },
    });

    return this.findById(booking.id);
  }

  async updateStatus(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateEventBookingStatusDto,
  ): Promise<EventBookingRow> {
    const booking = await this.findById(id); // 404 if missing

    if (booking.status === dto.status) {
      throw new ConflictException(`This booking is already ${dto.status}`);
    }
    // Cancelling is terminal: the seats went back to the pool and the payment
    // was refunded. Reviving it would need a fresh capacity check, so make the
    // visitor book again instead.
    if (booking.status === 'cancelled') {
      throw new ConflictException('This booking was already cancelled');
    }

    // No capacity re-check on confirm: only `pending -> confirmed` can reach
    // here, and a pending booking's seats are already counted in `booked`.

    await this.bookingsRepo.updateStatus(id, dto.status);
    if (dto.status === 'cancelled') {
      await this.bookingsRepo.refundPayment(id);
    }

    await this.audit.record({
      userId: user.id,
      action:
        dto.status === 'cancelled'
          ? AuditAction.EventBookingCancelled
          : AuditAction.EventBookingUpdated,
      subjectType: 'EventBooking',
      subjectId: id,
      metadata: {
        bookingReference: booking.bookingReference,
        status: dto.status,
      },
    });

    return this.findById(id);
  }
}
