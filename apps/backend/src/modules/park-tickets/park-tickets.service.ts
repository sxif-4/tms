import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'node:crypto';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  isSameUtcDay,
  toDateKey,
  utcMidnight,
} from '../../shared/utils/park-date';
import { ParkDaysService } from '../park-days/park-days.service';
import { ParkTicketTypesRepository } from '../park-ticket-types/park-ticket-types.repository';
import { UsersService } from '../users/users.service';
import { CreateParkTicketDto } from './dto/create-park-ticket.dto';
import { GateSaleDto } from './dto/gate-sale.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import {
  ParkTicketsRepository,
  type ParkTicketFilters,
  type ParkTicketRow,
} from './park-tickets.repository';

const BCRYPT_ROUNDS = 12;
const ref = () => `PT-${randomUUID().slice(0, 8).toUpperCase()}`;

interface SellTicketInput {
  buyerId: number;
  ticketTypeId: number;
  visitDate: Date;
  quantity: number;
  channel: 'online' | 'gate';
  /** Staff member for a gate sale; null when the visitor bought it themselves. */
  soldByUserId: number | null;
}

@Injectable()
export class ParkTicketsService {
  constructor(
    private readonly ticketsRepo: ParkTicketsRepository,
    private readonly ticketTypesRepo: ParkTicketTypesRepository,
    private readonly parkDays: ParkDaysService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  listAll(filters: ParkTicketFilters): Promise<ParkTicketRow[]> {
    return this.ticketsRepo.findAll(filters);
  }

  async findById(id: number): Promise<ParkTicketRow> {
    const ticket = await this.ticketsRepo.findRowById(id);
    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);
    return ticket;
  }

  getMine(userId: number): Promise<ParkTicketRow[]> {
    return this.ticketsRepo.findByUserId(userId);
  }

  /** Visitor online purchase — they are the buyer, and they pay by card. */
  async purchase(
    user: AuthenticatedUser,
    dto: CreateParkTicketDto,
  ): Promise<ParkTicketRow> {
    return this.sellTicket({
      buyerId: user.id,
      ticketTypeId: dto.ticketTypeId,
      visitDate: utcMidnight(dto.visitDate),
      quantity: dto.quantity,
      channel: 'online',
      soldByUserId: null,
    });
  }

  /**
   * Walk-up sale. `park_tickets.user_id` is NOT NULL but a walk-up customer may
   * have no account, so we find-or-create a visitor from the name/email on the
   * form. The ticket is never attached to the staff member's own user id — that
   * would corrupt every per-visitor report.
   */
  async gateSale(
    staff: AuthenticatedUser,
    dto: GateSaleDto,
  ): Promise<ParkTicketRow> {
    const buyerId = await this.findOrCreateVisitor(dto.name, dto.email);

    return this.sellTicket({
      buyerId,
      ticketTypeId: dto.ticketTypeId,
      visitDate: utcMidnight(dto.visitDate),
      quantity: dto.quantity,
      channel: 'gate',
      soldByUserId: staff.id,
    });
  }

  /** Read-only preview for the gate screen — deliberately does not mutate. */
  async lookup(reference: string): Promise<ParkTicketRow> {
    const ticket = await this.ticketsRepo.findRowByReference(reference.trim());
    if (!ticket) {
      throw new NotFoundException('No ticket with that reference');
    }
    return ticket;
  }

  /**
   * Gate check-in. Every rejection names its own reason — the whole point of the
   * screen is telling the operator what is wrong with the ticket in front of them.
   */
  async validate(
    staff: AuthenticatedUser,
    dto: ValidateTicketDto,
  ): Promise<ParkTicketRow> {
    const ticket = await this.lookup(dto.ticketReference); // 404 if unknown

    if (ticket.status === 'used') {
      throw new ConflictException(
        `Already checked in at ${ticket.updatedAt.toISOString()}`,
      );
    }
    if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      throw new ConflictException(`This ticket was ${ticket.status}`);
    }
    if (!isSameUtcDay(ticket.visitDate, new Date())) {
      throw new ConflictException(
        `This ticket is valid for ${toDateKey(ticket.visitDate)}, not today`,
      );
    }

    await this.ticketsRepo.updateStatus(ticket.id, 'used');
    await this.audit.record({
      userId: staff.id,
      action: AuditAction.ParkTicketValidated,
      subjectType: 'ParkTicket',
      subjectId: ticket.id,
      metadata: {
        ticketReference: ticket.ticketReference,
        quantity: ticket.quantity,
      },
    });
    return this.findById(ticket.id);
  }

  async updateStatus(
    staff: AuthenticatedUser,
    id: number,
    dto: UpdateTicketStatusDto,
  ): Promise<ParkTicketRow> {
    const ticket = await this.findById(id); // 404 if missing

    if (ticket.status === 'used') {
      throw new ConflictException(
        'This ticket has already been used at the gate',
      );
    }
    if (ticket.status === dto.status) {
      throw new ConflictException(`This ticket is already ${dto.status}`);
    }

    await this.ticketsRepo.updateStatus(id, dto.status);
    // Money already collected has to stop counting as revenue.
    if (dto.status === 'refunded') {
      await this.ticketsRepo.refundPayment(id);
    }

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.ParkTicketCancelled,
      subjectType: 'ParkTicket',
      subjectId: id,
      metadata: {
        ticketReference: ticket.ticketReference,
        status: dto.status,
      },
    });
    return this.findById(id);
  }

  /**
   * The one place a ticket is ever created. Online and gate sales share it so
   * the day-capacity rules can't drift apart between the two channels.
   */
  private async sellTicket(input: SellTicketInput): Promise<ParkTicketRow> {
    const ticketType = await this.ticketTypesRepo.findById(input.ticketTypeId);
    if (!ticketType) {
      throw new NotFoundException(
        `Park ticket type #${input.ticketTypeId} not found`,
      );
    }

    const today = utcMidnight(new Date());
    if (input.visitDate.getTime() < today.getTime()) {
      throw new BadRequestException('visitDate cannot be in the past');
    }

    // ParkDaysService owns "default vs override vs closed" — sales just obey it.
    const day = await this.parkDays.availabilityFor(input.visitDate);
    if (day.isClosed) {
      throw new ConflictException(
        `The park is closed on ${day.date}${day.note ? ` (${day.note})` : ''}`,
      );
    }
    if (input.quantity > day.remaining) {
      throw new ConflictException(
        `Only ${day.remaining} ticket(s) left for ${day.date}`,
      );
    }

    // Price snapshot: what the buyer was actually charged. Repricing the ticket
    // type later must never rewrite this.
    const totalAmount = (Number(ticketType.price) * input.quantity).toFixed(2);

    const ticket = await this.ticketsRepo.create({
      ticketReference: ref(),
      userId: input.buyerId,
      ticketTypeId: input.ticketTypeId,
      visitDate: input.visitDate,
      quantity: input.quantity,
      totalAmount,
      channel: input.channel,
      soldByUserId: input.soldByUserId,
      status: 'active',
    });

    await this.ticketsRepo.recordMockPayment({
      userId: input.buyerId,
      payableId: ticket.id,
      amount: totalAmount,
      method: input.channel === 'gate' ? 'cash' : 'card',
    });

    await this.audit.record({
      // Attribute the sale to whoever performed it: the staff member at the
      // gate, or the visitor themselves online.
      userId: input.soldByUserId ?? input.buyerId,
      action: AuditAction.ParkTicketSold,
      subjectType: 'ParkTicket',
      subjectId: ticket.id,
      metadata: {
        ticketReference: ticket.ticketReference,
        channel: input.channel,
        quantity: input.quantity,
        totalAmount,
        visitDate: toDateKey(input.visitDate),
      },
    });

    return this.findById(ticket.id);
  }

  /**
   * Gate customers may not have an account. Reuse one if the email is known,
   * otherwise create a visitor with an unguessable password — they can claim
   * the account later via a password reset.
   */
  private async findOrCreateVisitor(
    name: string,
    email: string,
  ): Promise<number> {
    const existing = await this.users.findByEmailWithRole(email);
    if (existing) return existing.id;

    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      BCRYPT_ROUNDS,
    );
    const created = await this.users.createVisitor({
      name,
      email,
      passwordHash,
    });
    return created.id;
  }
}
