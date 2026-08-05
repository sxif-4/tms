import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

export interface SailingFillRow {
  id: number;
  routeId: number;
  routeName: string;
  /** ISO 8601 UTC, matching every Drizzle-backed endpoint. See ISO_DEPARTURE_AT. */
  departureAt: string;
  direction: string;
  status: string;
  capacity: number;
  booked: number;
}

export interface RouteOccupancyRow {
  routeId: number;
  routeName: string;
  sailings: number;
  capacity: number;
  booked: number;
}

export interface RecentRequestRow {
  id: number;
  bookingReference: string;
  guestName: string;
  status: string;
  passengerCount: number;
  /** ISO 8601 UTC — see ISO_DEPARTURE_AT for why these are formatted in SQL. */
  createdAt: string;
  routeName: string;
  departureAt: string;
  hotelStatus: string;
}

export interface TodaysFill {
  capacity: number;
  booked: number;
}

/**
 * Read-only aggregations for the ferry-staff dashboard. Ferry RBAC is
 * network-wide (one operator, one network), so nothing here is scoped by
 * assignment — see ferryOperatorPlan.md decision 4.
 *
 * Cancelled bookings released their seat, so they never count as booked. Every
 * load figure below filters them out, matching the capacity rule the service
 * layer enforces on write.
 */
@Injectable()
export class FerryDashboardRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Bookings still waiting for a member of staff to issue a pass. */
  pendingPasses(): Promise<number> {
    const row = this.db.get<{ total: number }>(sql`
      SELECT COUNT(*) AS total FROM ferry_bookings WHERE status = 'pending'
    `);
    return Promise.resolve(row?.total ?? 0);
  }

  /** Sailings leaving today. A cancelled sailing is not a departure. */
  todaysDepartures(): Promise<number> {
    const row = this.db.get<{ total: number }>(sql`
      SELECT COUNT(*) AS total
      FROM ferry_schedules
      WHERE date(departure_at, 'unixepoch') = date('now')
        AND status != 'cancelled'
    `);
    return Promise.resolve(row?.total ?? 0);
  }

  /** Passengers checked in at the jetty today. */
  boardedToday(): Promise<number> {
    const row = this.db.get<{ total: number }>(sql`
      SELECT COALESCE(SUM(passenger_count), 0) AS total
      FROM ferry_bookings
      WHERE status = 'validated'
        AND date(validated_at, 'unixepoch') = date('now')
    `);
    return Promise.resolve(row?.total ?? 0);
  }

  /** Seats sold against seats available, across today's sailings only. */
  todaysFill(): Promise<TodaysFill> {
    const row = this.db.get<TodaysFill>(sql`
      SELECT
        COALESCE(SUM(s.capacity), 0) AS capacity,
        COALESCE(SUM(${BOOKED_SEATS}), 0) AS booked
      FROM ferry_schedules s
      WHERE date(s.departure_at, 'unixepoch') = date('now')
        AND s.status != 'cancelled'
    `);
    return Promise.resolve(row ?? { capacity: 0, booked: 0 });
  }

  nextSailings(limit = 5): Promise<SailingFillRow[]> {
    return Promise.resolve(
      this.db.all<SailingFillRow>(sql`
        SELECT s.id, s.route_id AS routeId, r.name AS routeName,
          ${ISO_DEPARTURE_AT} AS departureAt,
          s.direction, s.status, s.capacity,
          COALESCE(${BOOKED_SEATS}, 0) AS booked
        FROM ferry_schedules s
          JOIN ferry_routes r ON r.id = s.route_id
        WHERE s.departure_at >= unixepoch()
          AND s.status = 'scheduled'
        ORDER BY s.departure_at ASC
        LIMIT ${limit}
      `),
    );
  }

  /** Every route, including ones with no sailings yet — hence the LEFT JOIN. */
  routeOccupancy(): Promise<RouteOccupancyRow[]> {
    return Promise.resolve(
      this.db.all<RouteOccupancyRow>(sql`
        WITH sailing_load AS (
          SELECT s.id, s.route_id, s.capacity, COALESCE(${BOOKED_SEATS}, 0) AS booked
          FROM ferry_schedules s
          WHERE s.status != 'cancelled'
        )
        SELECT r.id AS routeId, r.name AS routeName,
          COUNT(l.id) AS sailings,
          COALESCE(SUM(l.capacity), 0) AS capacity,
          COALESCE(SUM(l.booked), 0) AS booked
        FROM ferry_routes r
          LEFT JOIN sailing_load l ON l.route_id = r.id
        GROUP BY r.id, r.name
        ORDER BY r.name
      `),
    );
  }

  /** Newest requests, with the stay behind each — the thing staff must judge. */
  recentRequests(limit = 5): Promise<RecentRequestRow[]> {
    return Promise.resolve(
      this.db.all<RecentRequestRow>(sql`
        SELECT b.id, b.booking_reference AS bookingReference, u.name AS guestName,
          b.status, b.passenger_count AS passengerCount,
          ${ISO_CREATED_AT} AS createdAt,
          r.name AS routeName, ${ISO_DEPARTURE_AT} AS departureAt,
          hb.status AS hotelStatus
        FROM ferry_bookings b
          JOIN users u ON u.id = b.user_id
          JOIN ferry_schedules s ON s.id = b.schedule_id
          JOIN ferry_routes r ON r.id = s.route_id
          JOIN hotel_bookings hb ON hb.id = b.hotel_booking_id
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT ${limit}
      `),
    );
  }
}

/**
 * Raw SQL bypasses Drizzle's `mode: 'timestamp'` mapping, so a timestamp would
 * otherwise leave here as a unix integer while every Drizzle-backed endpoint
 * emits an ISO string — the same field arriving as two different types
 * depending on which route you asked. Formatting in SQL keeps the API speaking
 * one language, at the cost of sub-second precision these columns never had.
 */
const ISO_DEPARTURE_AT = sql`strftime('%Y-%m-%dT%H:%M:%SZ', s.departure_at, 'unixepoch')`;
const ISO_CREATED_AT = sql`strftime('%Y-%m-%dT%H:%M:%SZ', b.created_at, 'unixepoch')`;

/** Cancelled bookings release their seats, so they never count as booked. */
const BOOKED_SEATS = sql`(
  SELECT COALESCE(SUM(b.passenger_count), 0)
  FROM ferry_bookings b
  WHERE b.schedule_id = s.id AND b.status != 'cancelled'
)`;
