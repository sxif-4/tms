import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  like,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  ferryBookings,
  ferryRoutes,
  ferrySchedules,
  hotelBookings,
  hotels,
  payments,
  users,
  type FerryBooking,
  type FerryRoute,
  type FerrySchedule,
  type HotelBooking,
  type NewFerryBooking,
  type NewFerryRoute,
  type NewFerrySchedule,
} from '../../shared/database/schema';

/** A hotel booking as displayed in the ferry booking form's "hotel booking" picker. */
export interface HotelBookingOptionRow {
  id: number;
  bookingReference: string;
  hotelId: number;
  hotelName: string;
  checkIn: Date;
  checkOut: Date;
  status: HotelBooking['status'];
}

/**
 * A booking with everything the operator needs to act on it — who is
 * travelling, on what sailing, and which stay authorises it. The raw table row
 * carries only foreign keys, which is why the booking queue could previously
 * show nothing but a reference.
 *
 * Every FK involved is NOT NULL, so all five joins are inner joins.
 */
export interface FerryBookingRow {
  id: number;
  bookingReference: string;
  status: FerryBooking['status'];
  passengerCount: number;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
  validatedBy: number | null;
  validatedAt: Date | null;
  // guest
  userId: number;
  guestName: string;
  guestEmail: string;
  // sailing
  scheduleId: number;
  routeId: number;
  routeName: string;
  origin: string;
  destination: string;
  departureAt: Date;
  direction: FerrySchedule['direction'];
  scheduleStatus: FerrySchedule['status'];
  capacity: number;
  basePrice: string;
  // the stay that authorises travel
  hotelBookingId: number;
  hotelUserId: number;
  hotelName: string;
  hotelBookingReference: string;
  hotelCheckIn: Date;
  hotelCheckOut: Date;
  hotelStatus: HotelBooking['status'];
}

/** Server-side filters for the booking queue. */
export interface FerryBookingFilters {
  status?: FerryBooking['status'];
  scheduleId?: number;
  routeId?: number;
  /** Departure window, not booking-creation window. */
  from?: Date;
  to?: Date;
  /** Matches booking reference, guest name, or guest email. */
  q?: string;
}

/** Sole owner of Drizzle queries for the ferry domain. */
@Injectable()
export class FerryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAllRoutes(): Promise<FerryRoute[]> {
    return Promise.resolve(
      this.db.select().from(ferryRoutes).orderBy(asc(ferryRoutes.name)).all(),
    );
  }

  findRouteById(id: number): Promise<FerryRoute | undefined> {
    return Promise.resolve(
      this.db.select().from(ferryRoutes).where(eq(ferryRoutes.id, id)).get(),
    );
  }

  createRoute(data: NewFerryRoute): Promise<FerryRoute> {
    return Promise.resolve(
      this.db.insert(ferryRoutes).values(data).returning().get(),
    );
  }

  updateRoute(
    id: number,
    data: Partial<NewFerryRoute>,
  ): Promise<FerryRoute | undefined> {
    return Promise.resolve(
      this.db
        .update(ferryRoutes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ferryRoutes.id, id))
        .returning()
        .get(),
    );
  }

  deleteRoute(id: number): Promise<void> {
    this.db.delete(ferryRoutes).where(eq(ferryRoutes.id, id)).run();
    return Promise.resolve();
  }

  /** Sailings hanging off a route — what makes deleting it a conflict. */
  countSchedulesByRouteId(routeId: number): Promise<number> {
    const row = this.db
      .select({ count: sql<number>`count(*)` })
      .from(ferrySchedules)
      .where(eq(ferrySchedules.routeId, routeId))
      .get();
    return Promise.resolve(row?.count ?? 0);
  }

  findAllSchedules(): Promise<FerrySchedule[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferrySchedules)
        .orderBy(asc(ferrySchedules.departureAt))
        .all(),
    );
  }

  findScheduleById(id: number): Promise<FerrySchedule | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferrySchedules)
        .where(eq(ferrySchedules.id, id))
        .get(),
    );
  }

  createSchedule(data: NewFerrySchedule): Promise<FerrySchedule> {
    return Promise.resolve(
      this.db.insert(ferrySchedules).values(data).returning().get(),
    );
  }

  updateSchedule(
    id: number,
    data: Partial<NewFerrySchedule>,
  ): Promise<FerrySchedule | undefined> {
    return Promise.resolve(
      this.db
        .update(ferrySchedules)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ferrySchedules.id, id))
        .returning()
        .get(),
    );
  }

  deleteSchedule(id: number): Promise<void> {
    this.db.delete(ferrySchedules).where(eq(ferrySchedules.id, id)).run();
    return Promise.resolve();
  }

  findHotelBookingById(id: number): Promise<HotelBooking | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(hotelBookings)
        .where(eq(hotelBookings.id, id))
        .get(),
    );
  }

  findHotelBookingsByUserId(userId: number): Promise<HotelBookingOptionRow[]> {
    const rows = this.db
      .select({
        id: hotelBookings.id,
        bookingReference: hotelBookings.bookingReference,
        hotelId: hotelBookings.hotelId,
        hotelName: hotels.name,
        checkIn: hotelBookings.checkIn,
        checkOut: hotelBookings.checkOut,
        status: hotelBookings.status,
      })
      .from(hotelBookings)
      .innerJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
      .where(eq(hotelBookings.userId, userId))
      .orderBy(desc(hotelBookings.checkIn))
      .all();
    return Promise.resolve(rows);
  }

  /**
   * Seats taken on a sailing. Cancelled bookings are excluded — cancelling has
   * to actually free the seat. `excludeBookingId` lets an update measure the
   * sailing as it would be *without* the booking being edited.
   */
  sumPassengersByScheduleId(
    scheduleId: number,
    excludeBookingId?: number,
  ): Promise<number> {
    const filters = [
      eq(ferryBookings.scheduleId, scheduleId),
      ne(ferryBookings.status, 'cancelled'),
    ];
    if (excludeBookingId != null) {
      filters.push(ne(ferryBookings.id, excludeBookingId));
    }

    const row = this.db
      .select({
        total: sql<number>`coalesce(sum(${ferryBookings.passengerCount}), 0)`,
      })
      .from(ferryBookings)
      .where(and(...filters))
      .get();
    return Promise.resolve(row?.total ?? 0);
  }

  /** Every booking on a sailing, cancelled ones included — for delete guards. */
  countBookingsByScheduleId(scheduleId: number): Promise<number> {
    const row = this.db
      .select({ count: sql<number>`count(*)` })
      .from(ferryBookings)
      .where(eq(ferryBookings.scheduleId, scheduleId))
      .get();
    return Promise.resolve(row?.count ?? 0);
  }

  findAllBookings(): Promise<FerryBooking[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferryBookings)
        .orderBy(desc(ferryBookings.createdAt))
        .all(),
    );
  }

  /** The one joined projection behind the queue, the detail view and the pass. */
  private bookingRowsQuery() {
    return this.db
      .select({
        id: ferryBookings.id,
        bookingReference: ferryBookings.bookingReference,
        status: ferryBookings.status,
        passengerCount: ferryBookings.passengerCount,
        totalAmount: ferryBookings.totalAmount,
        createdAt: ferryBookings.createdAt,
        updatedAt: ferryBookings.updatedAt,
        validatedBy: ferryBookings.validatedBy,
        validatedAt: ferryBookings.validatedAt,
        userId: ferryBookings.userId,
        guestName: users.name,
        guestEmail: users.email,
        scheduleId: ferryBookings.scheduleId,
        routeId: ferrySchedules.routeId,
        routeName: ferryRoutes.name,
        origin: ferryRoutes.origin,
        destination: ferryRoutes.destination,
        departureAt: ferrySchedules.departureAt,
        direction: ferrySchedules.direction,
        scheduleStatus: ferrySchedules.status,
        capacity: ferrySchedules.capacity,
        basePrice: ferrySchedules.basePrice,
        hotelBookingId: ferryBookings.hotelBookingId,
        hotelUserId: hotelBookings.userId,
        hotelName: hotels.name,
        hotelBookingReference: hotelBookings.bookingReference,
        hotelCheckIn: hotelBookings.checkIn,
        hotelCheckOut: hotelBookings.checkOut,
        hotelStatus: hotelBookings.status,
      })
      .from(ferryBookings)
      .innerJoin(users, eq(ferryBookings.userId, users.id))
      .innerJoin(
        ferrySchedules,
        eq(ferryBookings.scheduleId, ferrySchedules.id),
      )
      .innerJoin(ferryRoutes, eq(ferrySchedules.routeId, ferryRoutes.id))
      .innerJoin(
        hotelBookings,
        eq(ferryBookings.hotelBookingId, hotelBookings.id),
      )
      .innerJoin(hotels, eq(hotelBookings.hotelId, hotels.id));
  }

  findBookingRows(
    filters: FerryBookingFilters = {},
  ): Promise<FerryBookingRow[]> {
    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(ferryBookings.status, filters.status));
    }
    if (filters.scheduleId != null) {
      conditions.push(eq(ferryBookings.scheduleId, filters.scheduleId));
    }
    if (filters.routeId != null) {
      conditions.push(eq(ferrySchedules.routeId, filters.routeId));
    }
    if (filters.from) {
      conditions.push(gte(ferrySchedules.departureAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(ferrySchedules.departureAt, filters.to));
    }
    if (filters.q) {
      // SQLite LIKE is case-insensitive for ASCII, which is what staff expect.
      const term = `%${filters.q}%`;
      const match = or(
        like(ferryBookings.bookingReference, term),
        like(users.name, term),
        like(users.email, term),
      );
      if (match) conditions.push(match);
    }

    const query = this.bookingRowsQuery();
    const filtered = conditions.length
      ? query.where(and(...conditions))
      : query;
    return Promise.resolve(
      filtered.orderBy(desc(ferryBookings.createdAt)).all(),
    );
  }

  findBookingRowById(id: number): Promise<FerryBookingRow | undefined> {
    return Promise.resolve(
      this.bookingRowsQuery().where(eq(ferryBookings.id, id)).get(),
    );
  }

  findBookingRowByReference(
    reference: string,
  ): Promise<FerryBookingRow | undefined> {
    return Promise.resolve(
      this.bookingRowsQuery()
        .where(eq(ferryBookings.bookingReference, reference))
        .get(),
    );
  }

  findBookingById(id: number): Promise<FerryBooking | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(ferryBookings)
        .where(eq(ferryBookings.id, id))
        .get(),
    );
  }

  createBooking(data: NewFerryBooking): Promise<FerryBooking> {
    return Promise.resolve(
      this.db.insert(ferryBookings).values(data).returning().get(),
    );
  }

  updateBooking(
    id: number,
    data: Partial<NewFerryBooking>,
  ): Promise<FerryBooking | undefined> {
    return Promise.resolve(
      this.db
        .update(ferryBookings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ferryBookings.id, id))
        .returning()
        .get(),
    );
  }

  deleteBooking(id: number): Promise<void> {
    this.db.delete(ferryBookings).where(eq(ferryBookings.id, id)).run();
    return Promise.resolve();
  }

  /** Records the fare as taken when the pass is issued. No real processor is wired up. */
  recordMockPayment(input: {
    userId: number;
    payableId: number;
    amount: string;
    /** Card online; whatever the desk actually took otherwise. */
    method?: 'card' | 'cash' | 'bank_transfer';
  }): Promise<void> {
    this.db
      .insert(payments)
      .values({
        userId: input.userId,
        payableType: 'ferry_booking',
        payableId: input.payableId,
        amount: input.amount,
        status: 'completed',
        method: input.method ?? 'card',
        paymentReference: randomUUID(),
        paidAt: new Date(),
      })
      .run();
    return Promise.resolve();
  }

  /** Money already collected has to stop counting as revenue once cancelled. */
  refundPayment(bookingId: number): Promise<void> {
    this.db
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(
        and(
          eq(payments.payableType, 'ferry_booking'),
          eq(payments.payableId, bookingId),
        ),
      )
      .run();
    return Promise.resolve();
  }
}
