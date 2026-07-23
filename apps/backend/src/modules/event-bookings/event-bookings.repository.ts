import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  eventBookings,
  eventSchedules,
  events,
  parkTickets,
  payments,
  users,
  type EventBooking,
  type NewEventBooking,
} from '../../shared/database/schema';

export type EventBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface EventBookingRow {
  id: number;
  bookingReference: string;
  userId: number;
  visitorName: string;
  visitorEmail: string;
  eventScheduleId: number;
  startAt: Date;
  eventId: number;
  eventName: string;
  parkTicketId: number;
  ticketReference: string;
  quantity: number;
  totalAmount: string;
  status: EventBookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventBookingFilters {
  eventId?: number;
  scheduleId?: number;
  status?: EventBookingStatus;
}

const rowSelection = {
  id: eventBookings.id,
  bookingReference: eventBookings.bookingReference,
  userId: eventBookings.userId,
  visitorName: users.name,
  visitorEmail: users.email,
  eventScheduleId: eventBookings.eventScheduleId,
  startAt: eventSchedules.startAt,
  eventId: eventSchedules.eventId,
  eventName: events.name,
  parkTicketId: eventBookings.parkTicketId,
  ticketReference: parkTickets.ticketReference,
  quantity: eventBookings.quantity,
  totalAmount: eventBookings.totalAmount,
  status: eventBookings.status,
  createdAt: eventBookings.createdAt,
  updatedAt: eventBookings.updatedAt,
} as const;

/** Sole owner of Drizzle queries for event bookings. */
@Injectable()
export class EventBookingsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private joinedQuery() {
    return this.db
      .select(rowSelection)
      .from(eventBookings)
      .innerJoin(users, eq(eventBookings.userId, users.id))
      .innerJoin(
        eventSchedules,
        eq(eventBookings.eventScheduleId, eventSchedules.id),
      )
      .innerJoin(events, eq(eventSchedules.eventId, events.id))
      .innerJoin(parkTickets, eq(eventBookings.parkTicketId, parkTickets.id));
  }

  findAll(filters: EventBookingFilters = {}): Promise<EventBookingRow[]> {
    const conditions: SQL[] = [];
    if (filters.eventId !== undefined) {
      conditions.push(eq(eventSchedules.eventId, filters.eventId));
    }
    if (filters.scheduleId !== undefined) {
      conditions.push(eq(eventBookings.eventScheduleId, filters.scheduleId));
    }
    if (filters.status) {
      conditions.push(eq(eventBookings.status, filters.status));
    }

    return Promise.resolve(
      this.joinedQuery()
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(eventBookings.createdAt))
        .all(),
    );
  }

  findRowById(id: number): Promise<EventBookingRow | undefined> {
    return Promise.resolve(
      this.joinedQuery().where(eq(eventBookings.id, id)).get(),
    );
  }

  findByUserId(userId: number): Promise<EventBookingRow[]> {
    return Promise.resolve(
      this.joinedQuery()
        .where(eq(eventBookings.userId, userId))
        .orderBy(desc(eventSchedules.startAt))
        .all(),
    );
  }

  findById(id: number): Promise<EventBooking | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(eventBookings)
        .where(eq(eventBookings.id, id))
        .get(),
    );
  }

  create(data: NewEventBooking): Promise<EventBooking> {
    return Promise.resolve(
      this.db.insert(eventBookings).values(data).returning().get(),
    );
  }

  updateStatus(id: number, status: EventBookingStatus): Promise<void> {
    this.db
      .update(eventBookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(eventBookings.id, id))
      .run();
    return Promise.resolve();
  }

  /** Seats already taken on a schedule. Cancelled bookings give their seats back. */
  bookedSeats(scheduleId: number): Promise<number> {
    const row = this.db
      .select({
        booked: sql<number>`COALESCE(SUM(${eventBookings.quantity}), 0)`,
      })
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.eventScheduleId, scheduleId),
          ne(eventBookings.status, 'cancelled'),
        ),
      )
      .get();
    return Promise.resolve(row?.booked ?? 0);
  }

  /** Mock payment — no processor integrated, same as every other domain. */
  recordMockPayment(input: {
    userId: number;
    payableId: number;
    amount: string;
  }): Promise<void> {
    this.db
      .insert(payments)
      .values({
        userId: input.userId,
        payableType: 'event_booking',
        payableId: input.payableId,
        amount: input.amount,
        status: 'completed',
        method: 'card',
        paymentReference: randomUUID(),
        paidAt: new Date(),
      })
      .run();
    return Promise.resolve();
  }

  /** Cancelling stops the booking counting toward revenue. */
  refundPayment(bookingId: number): Promise<void> {
    this.db
      .update(payments)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(
        and(
          eq(payments.payableType, 'event_booking'),
          eq(payments.payableId, bookingId),
        ),
      )
      .run();
    return Promise.resolve();
  }
}
