import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  eventBookings,
  eventSchedules,
  events,
  parkTicketTypes,
} from '../../shared/database/schema';
import type { EventType, LocationType } from '../events/dto/create-event.dto';

export interface PublicTicketType {
  id: number;
  name: string;
  price: string;
}

export interface PublicEvent {
  id: number;
  name: string;
  description: string;
  eventType: string;
  locationType: string;
  basePrice: string;
}

export interface PublicSchedule {
  id: number;
  startAt: Date;
  capacity: number;
  remaining: number;
}

export interface PublicEventFilters {
  eventType?: EventType;
  locationType?: LocationType;
}

/**
 * Read-only, unauthenticated park data. Every selection here is deliberate:
 * nothing joins `users` or `park_tickets`, so buyer names, emails and ticket
 * references cannot leak through a public route.
 */
@Injectable()
export class PublicParkRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  ticketTypes(): Promise<PublicTicketType[]> {
    return Promise.resolve(
      this.db
        .select({
          id: parkTicketTypes.id,
          name: parkTicketTypes.name,
          price: parkTicketTypes.price,
        })
        .from(parkTicketTypes)
        .orderBy(asc(parkTicketTypes.price))
        .all(),
    );
  }

  /** Active events only — a retired ride shouldn't show up in the brochure. */
  activeEvents(filters: PublicEventFilters = {}): Promise<PublicEvent[]> {
    const conditions: SQL[] = [eq(events.isActive, true)];
    if (filters.eventType) {
      conditions.push(eq(events.eventType, filters.eventType));
    }
    if (filters.locationType) {
      conditions.push(eq(events.locationType, filters.locationType));
    }

    return Promise.resolve(
      this.db
        .select({
          id: events.id,
          name: events.name,
          description: events.description,
          eventType: events.eventType,
          locationType: events.locationType,
          basePrice: events.basePrice,
        })
        .from(events)
        .where(and(...conditions))
        .orderBy(asc(events.name))
        .all(),
    );
  }

  activeEventById(id: number): Promise<PublicEvent | undefined> {
    return Promise.resolve(
      this.db
        .select({
          id: events.id,
          name: events.name,
          description: events.description,
          eventType: events.eventType,
          locationType: events.locationType,
          basePrice: events.basePrice,
        })
        .from(events)
        .where(and(eq(events.id, id), eq(events.isActive, true)))
        .get(),
    );
  }

  /** Upcoming schedules with seats left — what a visitor can actually book. */
  upcomingSchedules(eventId: number): Promise<PublicSchedule[]> {
    const booked = sql<number>`
      COALESCE(SUM(
        CASE WHEN ${eventBookings.status} != 'cancelled'
        THEN ${eventBookings.quantity} ELSE 0 END
      ), 0)
    `;

    return Promise.resolve(
      this.db
        .select({
          id: eventSchedules.id,
          startAt: eventSchedules.startAt,
          capacity: eventSchedules.capacity,
          remaining: sql<number>`MAX(0, ${eventSchedules.capacity} - ${booked})`,
        })
        .from(eventSchedules)
        .leftJoin(
          eventBookings,
          eq(eventBookings.eventScheduleId, eventSchedules.id),
        )
        .where(
          and(
            eq(eventSchedules.eventId, eventId),
            gt(eventSchedules.startAt, new Date()),
          ),
        )
        .groupBy(eventSchedules.id)
        .orderBy(asc(eventSchedules.startAt))
        .all(),
    );
  }
}
