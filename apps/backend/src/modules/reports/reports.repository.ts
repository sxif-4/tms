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

/** The operational snapshot behind the admin overview's attention tiles. */
export interface OperationsRow {
  arrivalsToday: number;
  departuresToday: number;
  /** Guests currently mid-stay. */
  inHouse: number;
  /** Live bookings still without a physical room assigned. */
  unassignedRooms: number;
  pendingPaymentCount: number;
  pendingPaymentAmount: number;
  refundedCount: number;
  refundedAmount: number;
}

/** One hotel's occupancy over a date window, measured in room-nights. */
export interface OccupancyRow {
  hotelId: number;
  hotelName: string;
  rooms: number;
  roomNightsBooked: number;
  roomNightsAvailable: number;
}

/** An upcoming departure or event, with how full it is. */
export interface ScheduleFillRow {
  domain: 'ferry' | 'event';
  id: number;
  label: string;
  detail: string;
  startAt: number;
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

  /**
   * Everything the overview's attention tiles need, in one round trip. "Today"
   * is UTC-day based, matching how every other date bucket in this file is
   * derived (`date(col, 'unixepoch')`).
   */
  operations(): Promise<OperationsRow> {
    const row = this.db.get<OperationsRow>(sql`
      SELECT
        (SELECT COUNT(*) FROM hotel_bookings
           WHERE date(check_in, 'unixepoch') = date('now')
             AND status IN ('pending', 'confirmed')) AS arrivalsToday,
        (SELECT COUNT(*) FROM hotel_bookings
           WHERE date(check_out, 'unixepoch') = date('now')
             AND status IN ('confirmed', 'completed')) AS departuresToday,
        (SELECT COUNT(*) FROM hotel_bookings
           WHERE status = 'confirmed'
             AND check_in <= unixepoch('now')
             AND check_out > unixepoch('now')) AS inHouse,
        (SELECT COUNT(*) FROM hotel_bookings
           WHERE room_id IS NULL
             AND status IN ('pending', 'confirmed')) AS unassignedRooms,
        (SELECT COUNT(*) FROM payments WHERE status = 'pending')
          AS pendingPaymentCount,
        (SELECT COALESCE(SUM(CAST(amount AS REAL)), 0)
           FROM payments WHERE status = 'pending') AS pendingPaymentAmount,
        (SELECT COUNT(*) FROM payments WHERE status = 'refunded')
          AS refundedCount,
        (SELECT COALESCE(SUM(CAST(amount AS REAL)), 0)
           FROM payments WHERE status = 'refunded') AS refundedAmount
    `);
    return Promise.resolve(row);
  }

  /**
   * Occupancy as room-nights sold against room-nights available in the window.
   * Counting bookings instead would overstate a hotel whose stays sit in
   * different weeks — two one-night stays are not two full rooms.
   *
   * Each booking contributes only the nights that fall inside the window, so a
   * stay straddling the boundary is clipped rather than counted whole.
   */
  occupancy(
    fromSec: number,
    toSec: number,
    limit: number,
  ): Promise<OccupancyRow[]> {
    const nights = Math.max(1, Math.round((toSec - fromSec) / 86_400));
    const rows = this.db.all<OccupancyRow>(sql`
      SELECT
        h.id AS hotelId,
        h.name AS hotelName,
        (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.id) AS rooms,
        COALESCE((
          SELECT SUM(
            MAX(0, MIN(b.check_out, ${toSec}) - MAX(b.check_in, ${fromSec}))
          ) / 86400.0
          FROM hotel_bookings b
          WHERE b.hotel_id = h.id
            AND b.status IN ('confirmed', 'completed')
            AND b.check_in < ${toSec}
            AND b.check_out > ${fromSec}
        ), 0) AS roomNightsBooked,
        (SELECT COUNT(*) FROM rooms r WHERE r.hotel_id = h.id) * ${nights}
          AS roomNightsAvailable
      FROM hotels h
      WHERE h.is_active = 1
      ORDER BY roomNightsBooked DESC, h.name ASC
      LIMIT ${limit}
    `);
    return Promise.resolve(rows);
  }

  /**
   * Upcoming sailings and event schedules with their load, so the overview can
   * show what is departing soon and which of it is underselling.
   */
  scheduleFill(fromSec: number, toSec: number): Promise<ScheduleFillRow[]> {
    const rows = this.db.all<ScheduleFillRow>(sql`
      SELECT 'ferry' AS domain, s.id AS id,
             r.origin || ' → ' || r.destination AS label,
             r.name AS detail,
             s.departure_at AS startAt,
             s.capacity AS capacity,
             COALESCE((
               SELECT SUM(b.passenger_count) FROM ferry_bookings b
               WHERE b.schedule_id = s.id AND b.status != 'cancelled'
             ), 0) AS booked
        FROM ferry_schedules s
        JOIN ferry_routes r ON r.id = s.route_id
        WHERE s.departure_at BETWEEN ${fromSec} AND ${toSec}
      UNION ALL
      SELECT 'event', s.id,
             e.name,
             -- 'theme_park' / 'beach' — where the guest actually turns up.
             REPLACE(e.location_type, '_', ' '),
             s.start_at,
             s.capacity,
             COALESCE((
               SELECT SUM(b.quantity) FROM event_bookings b
               WHERE b.event_schedule_id = s.id AND b.status != 'cancelled'
             ), 0)
        FROM event_schedules s
        JOIN events e ON e.id = s.event_id
        WHERE s.start_at BETWEEN ${fromSec} AND ${toSec}
      ORDER BY startAt ASC
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
