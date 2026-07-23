import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  eventBookings,
  eventSchedules,
  events,
  type EventSchedule,
  type NewEventSchedule,
} from '../../shared/database/schema';

/** A schedule plus its live seat usage. `booked` excludes cancelled bookings. */
export interface EventScheduleRow {
  id: number;
  eventId: number;
  eventName: string;
  startAt: Date;
  capacity: number;
  booked: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventScheduleFilters {
  eventId?: number;
  from?: Date;
  to?: Date;
}

/** Sole owner of Drizzle queries for event schedules. */
@Injectable()
export class EventSchedulesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Seats already taken, folded in via a LEFT JOIN + GROUP BY so the capacity
   * dashboard can read `booked` straight off the row without an N+1.
   */
  private readonly bookedSeats = sql<number>`
    COALESCE(SUM(
      CASE WHEN ${eventBookings.status} != 'cancelled'
      THEN ${eventBookings.quantity} ELSE 0 END
    ), 0)
  `;

  findAll(filters: EventScheduleFilters = {}): Promise<EventScheduleRow[]> {
    const conditions: SQL[] = [];
    if (filters.eventId !== undefined) {
      conditions.push(eq(eventSchedules.eventId, filters.eventId));
    }
    if (filters.from) {
      conditions.push(gte(eventSchedules.startAt, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(eventSchedules.startAt, filters.to));
    }

    return Promise.resolve(
      this.db
        .select({
          id: eventSchedules.id,
          eventId: eventSchedules.eventId,
          eventName: events.name,
          startAt: eventSchedules.startAt,
          capacity: eventSchedules.capacity,
          booked: this.bookedSeats,
          createdAt: eventSchedules.createdAt,
          updatedAt: eventSchedules.updatedAt,
        })
        .from(eventSchedules)
        .innerJoin(events, eq(events.id, eventSchedules.eventId))
        .leftJoin(
          eventBookings,
          eq(eventBookings.eventScheduleId, eventSchedules.id),
        )
        .where(conditions.length ? and(...conditions) : undefined)
        .groupBy(eventSchedules.id)
        .orderBy(asc(eventSchedules.startAt))
        .all(),
    );
  }

  findRowById(id: number): Promise<EventScheduleRow | undefined> {
    return Promise.resolve(
      this.db
        .select({
          id: eventSchedules.id,
          eventId: eventSchedules.eventId,
          eventName: events.name,
          startAt: eventSchedules.startAt,
          capacity: eventSchedules.capacity,
          booked: this.bookedSeats,
          createdAt: eventSchedules.createdAt,
          updatedAt: eventSchedules.updatedAt,
        })
        .from(eventSchedules)
        .innerJoin(events, eq(events.id, eventSchedules.eventId))
        .leftJoin(
          eventBookings,
          eq(eventBookings.eventScheduleId, eventSchedules.id),
        )
        .where(eq(eventSchedules.id, id))
        .groupBy(eventSchedules.id)
        .get(),
    );
  }

  create(data: NewEventSchedule): Promise<EventSchedule> {
    return Promise.resolve(
      this.db.insert(eventSchedules).values(data).returning().get(),
    );
  }

  update(
    id: number,
    data: Partial<NewEventSchedule>,
  ): Promise<EventSchedule | undefined> {
    return Promise.resolve(
      this.db
        .update(eventSchedules)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(eventSchedules.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(eventSchedules).where(eq(eventSchedules.id, id)).run();
    return Promise.resolve();
  }

  /**
   * Every booking row, cancelled included — a cancelled booking still holds an
   * FK to the schedule, so deleting under it would trip the constraint.
   */
  countBookings(scheduleId: number): Promise<number> {
    const row = this.db
      .select({ count: sql<number>`count(*)` })
      .from(eventBookings)
      .where(eq(eventBookings.eventScheduleId, scheduleId))
      .get();
    return Promise.resolve(row?.count ?? 0);
  }
}
