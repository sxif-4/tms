import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  eventBookings,
  eventSchedules,
  events,
  imageables,
  images,
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
  /** Cover photo, or `null` until one's uploaded. */
  image: string | null;
}

export interface PublicSchedule {
  id: number;
  startAt: Date;
  capacity: number;
  remaining: number;
}

/** A schedule carrying its event, for the cross-event "what's on" agenda. */
export interface PublicUpcomingSchedule extends PublicSchedule {
  eventId: number;
  eventName: string;
  eventType: string;
  locationType: string;
  basePrice: string;
}

export interface PublicEventFilters {
  eventType?: EventType;
  locationType?: LocationType;
}

/**
 * The event's cover photo, in the same order the gallery uses: the flagged
 * cover first, then gallery position. Correlated rather than joined so an
 * event with several photos still yields exactly one row.
 *
 * The outer column is written out rather than interpolated: inside a select
 * field, `${events.id}` renders as a bare `"id"`, which the subquery resolves
 * against its own tables and silently matches nothing.
 */
const COVER_IMAGE = sql<string | null>`(
  SELECT i.url FROM imageables im
  JOIN images i ON i.id = im.image_id
  WHERE im.imageable_type = 'event' AND im.imageable_id = "events"."id"
  ORDER BY im.is_cover DESC, im.sort_order, i.id
  LIMIT 1
)`;

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
          image: COVER_IMAGE,
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
          image: COVER_IMAGE,
        })
        .from(events)
        .where(and(eq(events.id, id), eq(events.isActive, true)))
        .get(),
    );
  }

  /** Every photo for one event, cover first — the detail page's gallery. */
  eventGallery(id: number): Promise<string[]> {
    const rows = this.db
      .select({ url: images.url })
      .from(imageables)
      .innerJoin(images, eq(images.id, imageables.imageId))
      .where(
        and(
          eq(imageables.imageableType, 'event'),
          eq(imageables.imageableId, id),
        ),
      )
      .orderBy(desc(imageables.isCover), asc(imageables.sortOrder), asc(images.id))
      .all();
    return Promise.resolve(rows.map((r) => r.url));
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

  /**
   * The next runs of anything, across every active event — a chronological
   * "what's on" agenda. Without this the homepage would have to fetch each
   * event's detail separately just to learn when it next runs.
   */
  upcomingAcrossEvents(limit: number): Promise<PublicUpcomingSchedule[]> {
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
          eventId: events.id,
          eventName: events.name,
          eventType: events.eventType,
          locationType: events.locationType,
          basePrice: events.basePrice,
          startAt: eventSchedules.startAt,
          capacity: eventSchedules.capacity,
          remaining: sql<number>`MAX(0, ${eventSchedules.capacity} - ${booked})`,
        })
        .from(eventSchedules)
        .innerJoin(events, eq(events.id, eventSchedules.eventId))
        .leftJoin(
          eventBookings,
          eq(eventBookings.eventScheduleId, eventSchedules.id),
        )
        .where(
          and(
            eq(events.isActive, true),
            gt(eventSchedules.startAt, new Date()),
          ),
        )
        .groupBy(eventSchedules.id)
        .orderBy(asc(eventSchedules.startAt))
        .limit(limit)
        .all(),
    );
  }
}
