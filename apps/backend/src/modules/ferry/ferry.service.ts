import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import {
  addUtcDays,
  isSameUtcDay,
  toDateKey,
} from '../../shared/utils/park-date';
import {
  type FerryBooking,
  type FerryRoute,
  type FerrySchedule,
  type HotelBooking,
} from '../../shared/database/schema';
import { CreateFerryBookingDto } from './dto/create-ferry-booking.dto';
import { CreateFerryRouteDto } from './dto/create-ferry-route.dto';
import { CreateFerryScheduleDto } from './dto/create-ferry-schedule.dto';
import { UpdateFerryBookingDto } from './dto/update-ferry-booking.dto';
import { UpdateFerryRouteDto } from './dto/update-ferry-route.dto';
import { UpdateFerryScheduleDto } from './dto/update-ferry-schedule.dto';
import { ValidateFerryPassDto } from './dto/validate-ferry-pass.dto';
import {
  FerryRepository,
  type FerryBookingFilters,
  type FerryBookingRow,
  type HotelBookingOptionRow,
} from './ferry.repository';

export const FERRY_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'cancelled',
  'validated',
] as const;

/** The guest-facing ferry pass — the projection safe to hand over or print. */
export interface FerryPass {
  bookingReference: string;
  status: FerryBooking['status'];
  guestName: string;
  passengerCount: number;
  totalAmount: string;
  routeName: string;
  origin: string;
  destination: string;
  departureAt: Date;
  direction: FerrySchedule['direction'];
  hotelName: string;
  hotelBookingReference: string;
  /** Null until a pass is issued. See ferryOperatorPlan.md decision 2. */
  issuedAt: Date | null;
  validatedAt: Date | null;
}

/** The fields of a stay the eligibility rule actually reads. */
interface EligibleStay {
  userId: number;
  status: HotelBooking['status'];
  checkIn: Date;
  checkOut: Date;
}

const money = (value: number | string) => Number(value).toFixed(2);
const ref = () => `FB-${randomUUID().slice(0, 8).toUpperCase()}`;

/**
 * A stay only authorises ferry travel once it is actually paid for. A `pending`
 * booking is an unpaid intention, not a valid stay.
 */
const FERRY_ELIGIBLE_HOTEL_STATUSES: readonly HotelBooking['status'][] = [
  'confirmed',
  'completed',
];

/** Guests sail in the evening before check-in and the morning after check-out. */
const FERRY_TRAVEL_GRACE_DAYS = 1;

@Injectable()
export class FerryService {
  constructor(
    private readonly ferryRepo: FerryRepository,
    private readonly audit: AuditService,
  ) {}

  listRoutes(): Promise<FerryRoute[]> {
    return this.ferryRepo.findAllRoutes();
  }

  async getRouteById(id: number): Promise<FerryRoute> {
    const route = await this.ferryRepo.findRouteById(id);
    if (!route) throw new NotFoundException(`Ferry route #${id} not found`);
    return route;
  }

  async createRoute(
    staff: AuthenticatedUser,
    dto: CreateFerryRouteDto,
  ): Promise<FerryRoute> {
    const route = await this.ferryRepo.createRoute({
      name: dto.name,
      origin: dto.origin,
      destination: dto.destination,
    });

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryRouteCreated,
      subjectType: 'FerryRoute',
      subjectId: route.id,
      metadata: { name: route.name },
    });
    return route;
  }

  async updateRoute(
    staff: AuthenticatedUser,
    id: number,
    dto: UpdateFerryRouteDto,
  ): Promise<FerryRoute> {
    await this.getRouteById(id);

    const updated = await this.ferryRepo.updateRoute(id, {
      name: dto.name,
      origin: dto.origin,
      destination: dto.destination,
    });
    if (!updated) throw new NotFoundException(`Ferry route #${id} not found`);

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryRouteUpdated,
      subjectType: 'FerryRoute',
      subjectId: id,
      metadata: { name: updated.name },
    });
    return updated;
  }

  async removeRoute(staff: AuthenticatedUser, id: number): Promise<void> {
    const route = await this.getRouteById(id);

    // Without this the FK would surface as an opaque 500.
    const schedules = await this.ferryRepo.countSchedulesByRouteId(id);
    if (schedules > 0) {
      throw new ConflictException(
        `Cannot delete a route with ${schedules} sailing(s) — remove them first`,
      );
    }

    await this.ferryRepo.deleteRoute(id);
    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryRouteDeleted,
      subjectType: 'FerryRoute',
      subjectId: id,
      metadata: { name: route.name },
    });
  }

  listSchedules(): Promise<FerrySchedule[]> {
    return this.ferryRepo.findAllSchedules();
  }

  async getScheduleById(id: number): Promise<FerrySchedule> {
    const schedule = await this.ferryRepo.findScheduleById(id);
    if (!schedule)
      throw new NotFoundException(`Ferry schedule #${id} not found`);
    return schedule;
  }

  async createSchedule(
    staff: AuthenticatedUser,
    dto: CreateFerryScheduleDto,
  ): Promise<FerrySchedule> {
    await this.getRouteById(dto.routeId);

    const schedule = await this.ferryRepo.createSchedule({
      routeId: dto.routeId,
      departureAt: new Date(dto.departureAt),
      direction: dto.direction,
      capacity: dto.capacity,
      basePrice: money(dto.basePrice),
      status: dto.status,
    });

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryScheduleCreated,
      subjectType: 'FerrySchedule',
      subjectId: schedule.id,
      metadata: {
        routeId: schedule.routeId,
        departureAt: schedule.departureAt.toISOString(),
        capacity: schedule.capacity,
      },
    });
    return schedule;
  }

  async updateSchedule(
    staff: AuthenticatedUser,
    id: number,
    dto: UpdateFerryScheduleDto,
  ): Promise<FerrySchedule> {
    const current = await this.getScheduleById(id);

    if (dto.routeId != null) {
      await this.getRouteById(dto.routeId);
    }

    // Shrinking below what is already sold would silently oversell the sailing.
    if (dto.capacity != null && dto.capacity < current.capacity) {
      const booked = await this.ferryRepo.sumPassengersByScheduleId(id);
      if (dto.capacity < booked) {
        throw new ConflictException(
          `Capacity cannot drop below the ${booked} passenger(s) already booked`,
        );
      }
    }

    const updated = await this.ferryRepo.updateSchedule(id, {
      routeId: dto.routeId,
      departureAt: dto.departureAt ? new Date(dto.departureAt) : undefined,
      direction: dto.direction,
      capacity: dto.capacity,
      basePrice: dto.basePrice != null ? money(dto.basePrice) : undefined,
      status: dto.status,
    });
    if (!updated)
      throw new NotFoundException(`Ferry schedule #${id} not found`);

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryScheduleUpdated,
      subjectType: 'FerrySchedule',
      subjectId: id,
      metadata: { status: updated.status, capacity: updated.capacity },
    });
    return updated;
  }

  async removeSchedule(staff: AuthenticatedUser, id: number): Promise<void> {
    const schedule = await this.getScheduleById(id);

    const bookings = await this.ferryRepo.countBookingsByScheduleId(id);
    if (bookings > 0) {
      throw new ConflictException(
        `Cannot delete a sailing with ${bookings} booking(s) — cancel it instead`,
      );
    }

    await this.ferryRepo.deleteSchedule(id);
    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryScheduleDeleted,
      subjectType: 'FerrySchedule',
      subjectId: id,
      metadata: { departureAt: schedule.departureAt.toISOString() },
    });
  }

  /**
   * The spec's "valid hotel booking" rule, in one place, called from every path
   * that creates or edits a booking. Each rejection names its own reason —
   * staff need to know what to tell the guest at the counter.
   */
  private assertHotelBookingEligible(
    hotelBooking: EligibleStay,
    passengerUserId: number,
    departureAt: Date,
  ): void {
    if (hotelBooking.userId !== passengerUserId) {
      throw new BadRequestException(
        'That hotel booking belongs to a different guest',
      );
    }

    if (!FERRY_ELIGIBLE_HOTEL_STATUSES.includes(hotelBooking.status)) {
      throw new BadRequestException(
        `Hotel booking is ${hotelBooking.status} — a confirmed stay is required for ferry access`,
      );
    }

    // Date keys are `YYYY-MM-DD`, so lexicographic comparison is chronological.
    const from = toDateKey(
      addUtcDays(hotelBooking.checkIn, -FERRY_TRAVEL_GRACE_DAYS),
    );
    const to = toDateKey(
      addUtcDays(hotelBooking.checkOut, FERRY_TRAVEL_GRACE_DAYS),
    );
    const sailing = toDateKey(departureAt);

    if (sailing < from || sailing > to) {
      throw new BadRequestException(
        `Sailing on ${sailing} falls outside the stay ` +
          `(${toDateKey(hotelBooking.checkIn)} – ${toDateKey(hotelBooking.checkOut)})`,
      );
    }
  }

  /** A sailing can only take bookings while it is still going to sail. */
  private assertScheduleBookable(schedule: {
    status: FerrySchedule['status'];
    departureAt: Date;
  }): void {
    if (schedule.status !== 'scheduled') {
      throw new BadRequestException(`This sailing is ${schedule.status}`);
    }
    if (schedule.departureAt.getTime() <= Date.now()) {
      throw new BadRequestException('This sailing has already departed');
    }
  }

  /** Seats left on a sailing, ignoring one booking (the one being edited). */
  private async assertCapacity(
    schedule: FerrySchedule,
    passengerCount: number,
    excludeBookingId?: number,
  ): Promise<void> {
    const booked = await this.ferryRepo.sumPassengersByScheduleId(
      schedule.id,
      excludeBookingId,
    );
    const remaining = schedule.capacity - booked;

    if (passengerCount > remaining) {
      throw new BadRequestException(
        `Only ${remaining} seat(s) left on this sailing`,
      );
    }
  }

  /**
   * Hotel bookings a staff member can pick from when creating a ferry booking
   * for this user. Filtered to the same statuses the eligibility rule accepts,
   * so the picker can never offer an option the API would reject.
   */
  async listHotelBookingsForUser(
    userId: number,
  ): Promise<HotelBookingOptionRow[]> {
    const bookings = await this.ferryRepo.findHotelBookingsByUserId(userId);
    return bookings.filter((booking) =>
      FERRY_ELIGIBLE_HOTEL_STATUSES.includes(booking.status),
    );
  }

  listBookings(filters: FerryBookingFilters = {}): Promise<FerryBookingRow[]> {
    return this.ferryRepo.findBookingRows(filters);
  }

  async getBookingById(id: number): Promise<FerryBooking> {
    const booking = await this.ferryRepo.findBookingById(id);
    if (!booking) throw new NotFoundException(`Ferry booking #${id} not found`);
    return booking;
  }

  async getBookingRowById(id: number): Promise<FerryBookingRow> {
    const row = await this.ferryRepo.findBookingRowById(id);
    if (!row) throw new NotFoundException(`Ferry booking #${id} not found`);
    return row;
  }

  /** Read-only preview for the validation screen — deliberately does not mutate. */
  async lookup(reference: string): Promise<FerryBookingRow> {
    const row = await this.ferryRepo.findBookingRowByReference(
      reference.trim(),
    );
    if (!row) throw new NotFoundException('No booking with that reference');
    return row;
  }

  async getPass(id: number): Promise<FerryPass> {
    const row = await this.getBookingRowById(id);

    return {
      bookingReference: row.bookingReference,
      status: row.status,
      guestName: row.guestName,
      passengerCount: row.passengerCount,
      totalAmount: row.totalAmount,
      routeName: row.routeName,
      origin: row.origin,
      destination: row.destination,
      departureAt: row.departureAt,
      direction: row.direction,
      hotelName: row.hotelName,
      hotelBookingReference: row.hotelBookingReference,
      issuedAt: row.status === 'pending' ? null : row.updatedAt,
      validatedAt: row.validatedAt,
    };
  }

  /** The stay as the eligibility rule sees it, projected off a joined row. */
  private stayOf(row: FerryBookingRow): EligibleStay {
    return {
      userId: row.hotelUserId,
      status: row.hotelStatus,
      checkIn: row.hotelCheckIn,
      checkOut: row.hotelCheckOut,
    };
  }

  /**
   * Issue the pass — the spec's "provide customer with a ferry pass if valid
   * hotel booking exist". Eligibility is re-run here, not just at request time:
   * the stay may have been cancelled in between.
   */
  async issue(staff: AuthenticatedUser, id: number): Promise<FerryPass> {
    const row = await this.getBookingRowById(id);

    if (row.status === 'confirmed') {
      throw new ConflictException(
        'A pass has already been issued for this booking',
      );
    }
    if (row.status === 'validated') {
      throw new ConflictException('This passenger has already boarded');
    }
    if (row.status === 'cancelled') {
      throw new ConflictException('This booking was cancelled');
    }

    this.assertScheduleBookable({
      status: row.scheduleStatus,
      departureAt: row.departureAt,
    });
    this.assertHotelBookingEligible(
      this.stayOf(row),
      row.userId,
      row.departureAt,
    );

    await this.ferryRepo.updateBooking(id, { status: 'confirmed' });
    await this.ferryRepo.recordMockPayment({
      userId: row.userId,
      payableId: id,
      amount: row.totalAmount,
    });

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryBookingIssued,
      subjectType: 'FerryBooking',
      subjectId: id,
      metadata: {
        bookingReference: row.bookingReference,
        totalAmount: row.totalAmount,
      },
    });
    return this.getPass(id);
  }

  /**
   * Jetty check-in. Every rejection names its own reason — the whole point of
   * the screen is telling the operator what is wrong with the pass in front of
   * them.
   */
  async validate(
    staff: AuthenticatedUser,
    dto: ValidateFerryPassDto,
  ): Promise<FerryBookingRow> {
    const row = await this.lookup(dto.bookingReference); // 404 if unknown

    if (row.status === 'validated') {
      throw new ConflictException(
        `Already boarded at ${row.validatedAt?.toISOString() ?? 'an earlier time'}`,
      );
    }
    if (row.status === 'cancelled') {
      throw new ConflictException('This booking was cancelled');
    }
    if (row.status === 'pending') {
      throw new ConflictException(
        'No pass has been issued for this booking yet',
      );
    }
    if (!isSameUtcDay(row.departureAt, new Date())) {
      throw new ConflictException(
        `This pass is for ${toDateKey(row.departureAt)}, not today`,
      );
    }

    await this.ferryRepo.updateBooking(row.id, {
      status: 'validated',
      validatedBy: staff.id, // from the JWT, never the request body
      validatedAt: new Date(),
    });

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryBookingValidated,
      subjectType: 'FerryBooking',
      subjectId: row.id,
      metadata: {
        bookingReference: row.bookingReference,
        passengerCount: row.passengerCount,
      },
    });
    return this.getBookingRowById(row.id);
  }

  async cancel(staff: AuthenticatedUser, id: number): Promise<FerryBookingRow> {
    const row = await this.getBookingRowById(id);

    if (row.status === 'cancelled') {
      throw new ConflictException('This booking is already cancelled');
    }
    if (row.status === 'validated') {
      throw new ConflictException(
        'This passenger has already boarded — the trip cannot be undone',
      );
    }

    await this.ferryRepo.updateBooking(id, { status: 'cancelled' });
    // Only an issued pass ever took money.
    if (row.status === 'confirmed') {
      await this.ferryRepo.refundPayment(id);
    }

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryBookingCancelled,
      subjectType: 'FerryBooking',
      subjectId: id,
      metadata: {
        bookingReference: row.bookingReference,
        refunded: row.status === 'confirmed',
      },
    });
    return this.getBookingRowById(id);
  }

  async createBooking(
    staff: AuthenticatedUser,
    dto: CreateFerryBookingDto,
  ): Promise<FerryBooking> {
    const schedule = await this.getScheduleById(dto.scheduleId);
    this.assertScheduleBookable(schedule);

    const hotelBooking = await this.ferryRepo.findHotelBookingById(
      dto.hotelBookingId,
    );
    if (!hotelBooking) {
      throw new NotFoundException(
        `Hotel booking #${dto.hotelBookingId} not found`,
      );
    }

    this.assertHotelBookingEligible(
      hotelBooking,
      dto.userId,
      schedule.departureAt,
    );
    await this.assertCapacity(schedule, dto.passengerCount);

    const booking = await this.ferryRepo.createBooking({
      bookingReference: ref(),
      userId: dto.userId,
      scheduleId: dto.scheduleId,
      hotelBookingId: dto.hotelBookingId,
      passengerCount: dto.passengerCount,
      totalAmount: money(Number(schedule.basePrice) * dto.passengerCount),
      status: 'pending',
    });

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryBookingCreated,
      subjectType: 'FerryBooking',
      subjectId: booking.id,
      metadata: {
        bookingReference: booking.bookingReference,
        scheduleId: booking.scheduleId,
        passengerCount: booking.passengerCount,
      },
    });
    return booking;
  }

  async updateBooking(
    staff: AuthenticatedUser,
    id: number,
    dto: UpdateFerryBookingDto,
  ): Promise<FerryBooking> {
    const current = await this.getBookingById(id);

    const schedule = await this.getScheduleById(
      dto.scheduleId ?? current.scheduleId,
    );
    this.assertScheduleBookable(schedule);

    const hotelBooking = await this.ferryRepo.findHotelBookingById(
      current.hotelBookingId,
    );
    if (!hotelBooking) {
      throw new NotFoundException(
        `Hotel booking #${current.hotelBookingId} not found`,
      );
    }

    // Re-checked because moving to another sailing can push the departure
    // outside the stay that authorises it.
    this.assertHotelBookingEligible(
      hotelBooking,
      current.userId,
      schedule.departureAt,
    );

    const passengerCount = dto.passengerCount ?? current.passengerCount;
    await this.assertCapacity(schedule, passengerCount, current.id);

    const updated = await this.ferryRepo.updateBooking(id, {
      scheduleId: dto.scheduleId,
      passengerCount: dto.passengerCount,
      totalAmount: money(Number(schedule.basePrice) * passengerCount),
    });
    if (!updated) throw new NotFoundException(`Ferry booking #${id} not found`);

    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryBookingUpdated,
      subjectType: 'FerryBooking',
      subjectId: id,
      metadata: {
        bookingReference: updated.bookingReference,
        scheduleId: updated.scheduleId,
        passengerCount: updated.passengerCount,
      },
    });
    return updated;
  }

  async removeBooking(staff: AuthenticatedUser, id: number): Promise<void> {
    const booking = await this.getBookingById(id);

    await this.ferryRepo.deleteBooking(id);
    await this.audit.record({
      userId: staff.id,
      action: AuditAction.FerryBookingDeleted,
      subjectType: 'FerryBooking',
      subjectId: id,
      metadata: { bookingReference: booking.bookingReference },
    });
  }
}
