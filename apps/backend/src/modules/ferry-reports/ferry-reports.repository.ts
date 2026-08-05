import { Inject, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

/** One period of the sales report — day, week or month. */
export interface FerrySalesRow {
  key: string;
  bookings: number;
  passengers: number;
  revenue: number;
}

export interface FerryTripRow {
  scheduleId: number;
  routeId: number;
  routeName: string;
  /** ISO 8601 UTC — see ISO_DEPARTURE_AT. */
  departureAt: string;
  direction: string;
  status: string;
  capacity: number;
  booked: number;
  validated: number;
  revenue: number;
}

export interface FerryRouteReportRow {
  routeId: number;
  routeName: string;
  sailings: number;
  capacity: number;
  passengers: number;
  revenue: number;
}

/**
 * Aggregate-only ferry reporting. Revenue is always read from `payments`
 * (`status = 'completed'`) rather than by re-summing `total_amount`, because a
 * cancelled booking keeps its `total_amount` but its payment is refunded and
 * must stop counting as revenue — the same rule park reporting follows.
 *
 * Never selects guest names or emails: these numbers feed charts, not booking
 * detail (the ferry booking queue and the manifest serve that).
 */
@Injectable()
export class FerryReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Bookings/passengers are bucketed by when the request was made; revenue by
   * when the money was taken. A pass issued days after the request belongs to
   * the day it was paid for, which is why the two halves are unioned rather
   * than joined.
   */
  sales(
    fromSec: number,
    toSec: number,
    bucket: PeriodBucket,
  ): Promise<FerrySalesRow[]> {
    const bookingKey = periodExpr(sql`b.created_at`, bucket);
    const paymentKey = periodExpr(sql`p.paid_at`, bucket);

    return Promise.resolve(
      this.db.all<FerrySalesRow>(sql`
        SELECT key,
          COALESCE(SUM(bookings), 0) AS bookings,
          COALESCE(SUM(passengers), 0) AS passengers,
          COALESCE(SUM(revenue), 0) AS revenue
        FROM (
          SELECT ${bookingKey} AS key,
            1 AS bookings, b.passenger_count AS passengers, 0 AS revenue
          FROM ferry_bookings b
          WHERE b.status != 'cancelled'
            AND b.created_at BETWEEN ${fromSec} AND ${toSec}
          UNION ALL
          SELECT ${paymentKey} AS key,
            0 AS bookings, 0 AS passengers, CAST(p.amount AS REAL) AS revenue
          FROM payments p
          WHERE p.payable_type = 'ferry_booking'
            AND p.status = 'completed'
            AND p.paid_at BETWEEN ${fromSec} AND ${toSec}
        )
        GROUP BY key ORDER BY key
      `),
    );
  }

  /** One row per sailing in the window — the trip report. */
  trips(
    fromSec: number,
    toSec: number,
    routeId?: number,
  ): Promise<FerryTripRow[]> {
    const routeFilter =
      routeId != null ? sql`AND s.route_id = ${routeId}` : sql``;

    return Promise.resolve(
      this.db.all<FerryTripRow>(sql`
        SELECT s.id AS scheduleId, s.route_id AS routeId, r.name AS routeName,
          ${ISO_DEPARTURE_AT} AS departureAt,
          s.direction, s.status, s.capacity,
          ${BOOKED_SEATS} AS booked,
          ${VALIDATED_SEATS} AS validated,
          ${SAILING_REVENUE} AS revenue
        FROM ferry_schedules s
          JOIN ferry_routes r ON r.id = s.route_id
        WHERE s.departure_at BETWEEN ${fromSec} AND ${toSec}
          ${routeFilter}
        ORDER BY s.departure_at DESC
      `),
    );
  }

  /** Every route, including ones with no sailings in the window. */
  routes(fromSec: number, toSec: number): Promise<FerryRouteReportRow[]> {
    return Promise.resolve(
      this.db.all<FerryRouteReportRow>(sql`
        WITH sailing_totals AS (
          SELECT s.id, s.route_id, s.capacity,
            ${BOOKED_SEATS} AS booked,
            ${SAILING_REVENUE} AS revenue
          FROM ferry_schedules s
          WHERE s.departure_at BETWEEN ${fromSec} AND ${toSec}
            AND s.status != 'cancelled'
        )
        SELECT r.id AS routeId, r.name AS routeName,
          COUNT(t.id) AS sailings,
          COALESCE(SUM(t.capacity), 0) AS capacity,
          COALESCE(SUM(t.booked), 0) AS passengers,
          COALESCE(SUM(t.revenue), 0) AS revenue
        FROM ferry_routes r
          LEFT JOIN sailing_totals t ON t.route_id = r.id
        GROUP BY r.id, r.name
        ORDER BY revenue DESC, r.name
      `),
    );
  }
}

export const PERIOD_BUCKETS = ['day', 'week', 'month'] as const;
export type PeriodBucket = (typeof PERIOD_BUCKETS)[number];

/** `2026-08-05`, `2026-W31` or `2026-08` — whatever the caller asked to group by. */
function periodExpr(column: SQL, bucket: PeriodBucket): SQL {
  switch (bucket) {
    case 'week':
      return sql`strftime('%Y-W%W', ${column}, 'unixepoch')`;
    case 'month':
      return sql`strftime('%Y-%m', ${column}, 'unixepoch')`;
    case 'day':
      return sql`date(${column}, 'unixepoch')`;
  }
}

/**
 * Raw SQL bypasses Drizzle's `mode: 'timestamp'` mapping, so timestamps are
 * formatted to ISO here — see the same note in ferry-dashboard.repository.ts.
 */
const ISO_DEPARTURE_AT = sql`strftime('%Y-%m-%dT%H:%M:%SZ', s.departure_at, 'unixepoch')`;

/** Cancelled bookings release their seats, so they never count as booked. */
const BOOKED_SEATS = sql`(
  SELECT COALESCE(SUM(b.passenger_count), 0)
  FROM ferry_bookings b
  WHERE b.schedule_id = s.id AND b.status != 'cancelled'
)`;

/** Passengers who actually boarded — the denominator for no-shows. */
const VALIDATED_SEATS = sql`(
  SELECT COALESCE(SUM(b.passenger_count), 0)
  FROM ferry_bookings b
  WHERE b.schedule_id = s.id AND b.status = 'validated'
)`;

/** Money actually held for this sailing: completed, unrefunded payments only. */
const SAILING_REVENUE = sql`(
  SELECT COALESCE(SUM(CAST(p.amount AS REAL)), 0)
  FROM payments p
    JOIN ferry_bookings b ON b.id = p.payable_id
  WHERE p.payable_type = 'ferry_booking'
    AND p.status = 'completed'
    AND b.schedule_id = s.id
)`;
