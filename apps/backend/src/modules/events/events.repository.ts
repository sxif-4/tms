import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  eventSchedules,
  events,
  type Event,
  type NewEvent,
} from '../../shared/database/schema';

export interface EventFilters {
  eventType?: Event['eventType'];
  locationType?: Event['locationType'];
  isActive?: boolean;
}

/** Sole owner of Drizzle queries for events (rides, shows, beach events). */
@Injectable()
export class EventsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll(filters: EventFilters = {}): Promise<Event[]> {
    const conditions: SQL[] = [];
    if (filters.eventType) {
      conditions.push(eq(events.eventType, filters.eventType));
    }
    if (filters.locationType) {
      conditions.push(eq(events.locationType, filters.locationType));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(events.isActive, filters.isActive));
    }

    return Promise.resolve(
      this.db
        .select()
        .from(events)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(events.name))
        .all(),
    );
  }

  findById(id: number): Promise<Event | undefined> {
    return Promise.resolve(
      this.db.select().from(events).where(eq(events.id, id)).get(),
    );
  }

  create(data: NewEvent): Promise<Event> {
    return Promise.resolve(
      this.db.insert(events).values(data).returning().get(),
    );
  }

  update(id: number, data: Partial<NewEvent>): Promise<Event | undefined> {
    return Promise.resolve(
      this.db
        .update(events)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(events.id, id))
        .returning()
        .get(),
    );
  }

  delete(id: number): Promise<void> {
    this.db.delete(events).where(eq(events.id, id)).run();
    return Promise.resolve();
  }

  /** How many schedules hang off this event — blocks deletion. */
  countSchedules(eventId: number): Promise<number> {
    const row = this.db
      .select({ count: sql<number>`count(*)` })
      .from(eventSchedules)
      .where(eq(eventSchedules.eventId, eventId))
      .get();
    return Promise.resolve(row?.count ?? 0);
  }
}
