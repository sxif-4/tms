import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

/** One row of the sales report, whatever it was grouped by. */
export interface SalesRow {
  key: string;
  ticketsSold: number;
  revenue: number;
}

export interface VisitorRow {
  day: string;
  sold: number;
  checkedIn: number;
  checkInRate: number;
}

export interface EventReportRow {
  eventId: number;
  eventName: string;
  eventType: string;
  schedulesRun: number;
  capacity: number;
  seatsSold: number;
  fillRate: number;
  revenue: number;
}

/**
 * Aggregate-only park reporting. Revenue is always read from `payments`
 * (`status = 'completed'`) rather than by re-summing `total_amount`, because a
 * refunded ticket keeps its `total_amount` but must stop counting as revenue.
 *
 * Never selects buyer names/emails — these numbers feed charts, not staff
 * booking detail (park-tickets serves that).
 */
@Injectable()
export class ParkReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Sales by day. Revenue covers the whole park — tickets *and* event bookings
   * — because "sales over time" is the park's total take, not just gate sales.
   */
  salesByDay(fromSec: number, toSec: number): Promise<SalesRow[]> {
    return Promise.resolve(
      this.db.all<SalesRow>(sql`
        SELECT day AS key,
          COALESCE(SUM(ticketsSold), 0) AS ticketsSold,
          COALESCE(SUM(revenue), 0) AS revenue
        FROM (
          SELECT date(p.paid_at, 'unixepoch') AS day,
            0 AS ticketsSold,
            CAST(p.amount AS REAL) AS revenue
          FROM payments p
          WHERE p.payable_type IN ('park_ticket', 'event_booking')
            AND p.status = 'completed'
            AND p.paid_at BETWEEN ${fromSec} AND ${toSec}
          UNION ALL
          SELECT date(t.created_at, 'unixepoch') AS day,
            t.quantity AS ticketsSold,
            0 AS revenue
          FROM park_tickets t
          WHERE t.status != 'cancelled'
            AND t.created_at BETWEEN ${fromSec} AND ${toSec}
        )
        GROUP BY day ORDER BY day
      `),
    );
  }

  /** Ticket-only dimensions: revenue here is park_ticket payments, not event bookings. */
  salesByTicketType(fromSec: number, toSec: number): Promise<SalesRow[]> {
    return Promise.resolve(
      this.db.all<SalesRow>(sql`
        SELECT ty.name AS key,
          COALESCE(SUM(t.quantity), 0) AS ticketsSold,
          COALESCE(SUM(CAST(p.amount AS REAL)), 0) AS revenue
        FROM park_tickets t
          JOIN park_ticket_types ty ON ty.id = t.ticket_type_id
          LEFT JOIN payments p
            ON p.payable_type = 'park_ticket' AND p.payable_id = t.id
            AND p.status = 'completed'
        WHERE t.status != 'cancelled'
          AND t.created_at BETWEEN ${fromSec} AND ${toSec}
        GROUP BY ty.id ORDER BY revenue DESC
      `),
    );
  }

  salesByChannel(fromSec: number, toSec: number): Promise<SalesRow[]> {
    return Promise.resolve(
      this.db.all<SalesRow>(sql`
        SELECT t.channel AS key,
          COALESCE(SUM(t.quantity), 0) AS ticketsSold,
          COALESCE(SUM(CAST(p.amount AS REAL)), 0) AS revenue
        FROM park_tickets t
          LEFT JOIN payments p
            ON p.payable_type = 'park_ticket' AND p.payable_id = t.id
            AND p.status = 'completed'
        WHERE t.status != 'cancelled'
          AND t.created_at BETWEEN ${fromSec} AND ${toSec}
        GROUP BY t.channel ORDER BY revenue DESC
      `),
    );
  }

  /** Sold vs actually checked in, per visit day — the check-in rate. */
  visitors(fromSec: number, toSec: number): Promise<VisitorRow[]> {
    return Promise.resolve(
      this.db.all<VisitorRow>(sql`
        SELECT date(visit_date, 'unixepoch') AS day,
          COALESCE(SUM(CASE WHEN status IN ('active', 'used') THEN quantity ELSE 0 END), 0) AS sold,
          COALESCE(SUM(CASE WHEN status = 'used' THEN quantity ELSE 0 END), 0) AS checkedIn,
          ROUND(
            CASE WHEN SUM(CASE WHEN status IN ('active', 'used') THEN quantity ELSE 0 END) > 0
              THEN CAST(SUM(CASE WHEN status = 'used' THEN quantity ELSE 0 END) AS REAL) * 100
                   / SUM(CASE WHEN status IN ('active', 'used') THEN quantity ELSE 0 END)
              ELSE 0 END, 1
          ) AS checkInRate
        FROM park_tickets
        WHERE visit_date BETWEEN ${fromSec} AND ${toSec}
        GROUP BY day ORDER BY day
      `),
    );
  }

  /**
   * Per-event: schedules run, seats sold against capacity, fill rate and revenue.
   * Aggregated in two independent subqueries — joining schedules and bookings in
   * one pass would multiply each schedule's capacity by its number of bookings.
   */
  events(fromSec: number, toSec: number): Promise<EventReportRow[]> {
    return Promise.resolve(
      this.db.all<EventReportRow>(sql`
        SELECT e.id AS eventId, e.name AS eventName, e.event_type AS eventType,
          sch.schedulesRun, sch.capacity,
          COALESCE(seats.seatsSold, 0) AS seatsSold,
          ROUND(
            CASE WHEN sch.capacity > 0
              THEN CAST(COALESCE(seats.seatsSold, 0) AS REAL) * 100 / sch.capacity
              ELSE 0 END, 1
          ) AS fillRate,
          COALESCE(seats.revenue, 0) AS revenue
        FROM events e
          JOIN (
            SELECT event_id, COUNT(*) AS schedulesRun, SUM(capacity) AS capacity
            FROM event_schedules
            WHERE start_at BETWEEN ${fromSec} AND ${toSec}
            GROUP BY event_id
          ) sch ON sch.event_id = e.id
          LEFT JOIN (
            SELECT s.event_id AS eventId,
              SUM(CASE WHEN b.status != 'cancelled' THEN b.quantity ELSE 0 END) AS seatsSold,
              SUM(CASE WHEN p.status = 'completed' THEN CAST(p.amount AS REAL) ELSE 0 END) AS revenue
            FROM event_bookings b
              JOIN event_schedules s ON s.id = b.event_schedule_id
              LEFT JOIN payments p
                ON p.payable_type = 'event_booking' AND p.payable_id = b.id
            WHERE s.start_at BETWEEN ${fromSec} AND ${toSec}
            GROUP BY s.event_id
          ) seats ON seats.eventId = e.id
        ORDER BY revenue DESC
      `),
    );
  }
}
