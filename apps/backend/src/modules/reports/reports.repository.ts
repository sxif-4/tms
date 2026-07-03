import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

export interface OverviewRow {
  totalUsers: number;
  activeBookings: number;
  revenue: number;
  ticketsSold: number;
}

export interface SalesRow {
  day: string;
  domain: 'hotel' | 'ferry' | 'park' | 'event';
  revenue: number;
}

export interface UsageRow {
  domain: 'ferry' | 'event';
  capacity: number;
  booked: number;
}

/**
 * Read-only aggregation queries for admin reports. Money is stored as text, so
 * sums cast to REAL. "Revenue over time" is keyed on each booking's service
 * date (check-in / departure / visit / event start), which is spread across the
 * calendar — unlike payment dates.
 */
@Injectable()
export class ReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  overview(): Promise<OverviewRow> {
    const row = this.db.get<OverviewRow>(sql`
      SELECT
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COALESCE(SUM(CAST(amount AS REAL)), 0)
           FROM payments WHERE status = 'completed') AS revenue,
        (SELECT COALESCE(SUM(quantity), 0)
           FROM park_tickets WHERE status IN ('active', 'used')) AS ticketsSold,
        (
          (SELECT COUNT(*) FROM hotel_bookings WHERE status != 'cancelled') +
          (SELECT COUNT(*) FROM ferry_bookings WHERE status != 'cancelled') +
          (SELECT COUNT(*) FROM event_bookings WHERE status != 'cancelled')
        ) AS activeBookings
    `);
    return Promise.resolve(row);
  }

  salesByServiceDate(fromSec: number, toSec: number): Promise<SalesRow[]> {
    const rows = this.db.all<SalesRow>(sql`
      SELECT day, domain, SUM(revenue) AS revenue FROM (
        SELECT date(check_in, 'unixepoch') AS day, 'hotel' AS domain,
               CAST(total_amount AS REAL) AS revenue
          FROM hotel_bookings
          WHERE status != 'cancelled' AND check_in BETWEEN ${fromSec} AND ${toSec}
        UNION ALL
        SELECT date(s.departure_at, 'unixepoch'), 'ferry',
               CAST(b.total_amount AS REAL)
          FROM ferry_bookings b JOIN ferry_schedules s ON s.id = b.schedule_id
          WHERE b.status != 'cancelled'
            AND s.departure_at BETWEEN ${fromSec} AND ${toSec}
        UNION ALL
        SELECT date(visit_date, 'unixepoch'), 'park', CAST(total_amount AS REAL)
          FROM park_tickets
          WHERE status != 'cancelled' AND visit_date BETWEEN ${fromSec} AND ${toSec}
        UNION ALL
        SELECT date(s.start_at, 'unixepoch'), 'event', CAST(b.total_amount AS REAL)
          FROM event_bookings b JOIN event_schedules s ON s.id = b.event_schedule_id
          WHERE b.status != 'cancelled'
            AND s.start_at BETWEEN ${fromSec} AND ${toSec}
      )
      GROUP BY day, domain
      ORDER BY day
    `);
    return Promise.resolve(rows);
  }

  usage(): Promise<UsageRow[]> {
    const rows = this.db.all<UsageRow>(sql`
      SELECT 'ferry' AS domain,
        (SELECT COALESCE(SUM(capacity), 0) FROM ferry_schedules) AS capacity,
        (SELECT COALESCE(SUM(passenger_count), 0)
           FROM ferry_bookings WHERE status != 'cancelled') AS booked
      UNION ALL
      SELECT 'event',
        (SELECT COALESCE(SUM(capacity), 0) FROM event_schedules),
        (SELECT COALESCE(SUM(quantity), 0)
           FROM event_bookings WHERE status != 'cancelled')
    `);
    return Promise.resolve(rows);
  }
}
