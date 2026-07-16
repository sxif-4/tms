import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';

export interface ChannelSplit {
  online: number;
  gate: number;
  total: number;
}

export interface RevenuePoint {
  day: string;
  revenue: number;
}

export interface GateTicketRow {
  id: number;
  ticketReference: string;
  buyerName: string;
  ticketTypeName: string;
  quantity: number;
  status: string;
  channel: string;
}

export interface ScheduleFillRow {
  id: number;
  eventId: number;
  eventName: string;
  startAt: number;
  capacity: number;
  booked: number;
  fillRate: number;
}

/**
 * Read-only aggregations for the park-staff dashboard. Park RBAC is park-wide
 * (there is only one theme park), so nothing here is scoped by assignment.
 *
 * Revenue always comes from `payments` — the single source of sales truth
 * across every domain — never by re-summing `total_amount`, which would keep
 * counting refunded tickets.
 */
@Injectable()
export class ParkDashboardRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Tickets *sold* today (by sale date), split by channel. Cancelled sales don't count. */
  ticketsSoldToday(): Promise<ChannelSplit> {
    const row = this.db.get<ChannelSplit>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN channel = 'online' THEN quantity ELSE 0 END), 0) AS online,
        COALESCE(SUM(CASE WHEN channel = 'gate'   THEN quantity ELSE 0 END), 0) AS gate,
        COALESCE(SUM(quantity), 0) AS total
      FROM park_tickets
      WHERE status != 'cancelled'
        AND date(created_at, 'unixepoch') = date('now')
    `);
    return Promise.resolve(row ?? { online: 0, gate: 0, total: 0 });
  }

  /** Completed park revenue (tickets + event bookings) between two unix seconds. */
  revenueBetween(fromSec: number, toSec: number): Promise<number> {
    const row = this.db.get<{ revenue: number }>(sql`
      SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) AS revenue
      FROM payments
      WHERE payable_type IN ('park_ticket', 'event_booking')
        AND status = 'completed'
        AND paid_at BETWEEN ${fromSec} AND ${toSec}
    `);
    return Promise.resolve(row?.revenue ?? 0);
  }

  revenueTrend(days = 30): Promise<RevenuePoint[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = nowSec - days * 86_400;
    return Promise.resolve(
      this.db.all<RevenuePoint>(sql`
        SELECT date(paid_at, 'unixepoch') AS day,
          COALESCE(SUM(CAST(amount AS REAL)), 0) AS revenue
        FROM payments
        WHERE payable_type IN ('park_ticket', 'event_booking')
          AND status = 'completed'
          AND paid_at BETWEEN ${fromSec} AND ${nowSec}
        GROUP BY day ORDER BY day
      `),
    );
  }

  /** Visitors actually through the gate today — tickets marked `used`. */
  checkedInToday(): Promise<number> {
    const row = this.db.get<{ visitors: number }>(sql`
      SELECT COALESCE(SUM(quantity), 0) AS visitors
      FROM park_tickets
      WHERE status = 'used'
        AND date(visit_date, 'unixepoch') = date('now')
    `);
    return Promise.resolve(row?.visitors ?? 0);
  }

  /** Every ticket valid for today, so the gate can see who has and hasn't arrived. */
  todaysGate(limit = 20): Promise<{
    expected: number;
    checkedIn: number;
    notArrived: number;
    items: GateTicketRow[];
  }> {
    const totals = this.db.get<{ expected: number; checkedIn: number }>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status IN ('active', 'used') THEN quantity ELSE 0 END), 0) AS expected,
        COALESCE(SUM(CASE WHEN status = 'used' THEN quantity ELSE 0 END), 0) AS checkedIn
      FROM park_tickets
      WHERE date(visit_date, 'unixepoch') = date('now')
    `);
    const items = this.db.all<GateTicketRow>(sql`
      SELECT t.id, t.ticket_reference AS ticketReference, u.name AS buyerName,
        ty.name AS ticketTypeName, t.quantity, t.status, t.channel
      FROM park_tickets t
        JOIN users u ON u.id = t.user_id
        JOIN park_ticket_types ty ON ty.id = t.ticket_type_id
      WHERE date(t.visit_date, 'unixepoch') = date('now')
        AND t.status IN ('active', 'used')
      ORDER BY t.status ASC, t.created_at DESC
      LIMIT ${limit}
    `);
    const expected = totals?.expected ?? 0;
    const checkedIn = totals?.checkedIn ?? 0;
    return Promise.resolve({
      expected,
      checkedIn,
      notArrived: Math.max(0, expected - checkedIn),
      items,
    });
  }

  /** Upcoming schedules at or above `threshold` full — the ones about to sell out. */
  schedulesNearCapacity(
    threshold = 0.9,
    limit = 10,
  ): Promise<ScheduleFillRow[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    return Promise.resolve(
      this.db.all<ScheduleFillRow>(sql`
        SELECT s.id, s.event_id AS eventId, e.name AS eventName, s.start_at AS startAt,
          s.capacity, ${BOOKED_SEATS} AS booked,
          CAST(${BOOKED_SEATS} AS REAL) / s.capacity AS fillRate
        FROM event_schedules s
          JOIN events e ON e.id = s.event_id
          LEFT JOIN event_bookings b
            ON b.event_schedule_id = s.id AND b.status != 'cancelled'
        WHERE s.start_at > ${nowSec} AND s.capacity > 0
        GROUP BY s.id
        HAVING fillRate >= ${threshold}
        ORDER BY fillRate DESC, s.start_at ASC
        LIMIT ${limit}
      `),
    );
  }

  upcomingSchedules(limit = 10): Promise<ScheduleFillRow[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    return Promise.resolve(
      this.db.all<ScheduleFillRow>(sql`
        SELECT s.id, s.event_id AS eventId, e.name AS eventName, s.start_at AS startAt,
          s.capacity, ${BOOKED_SEATS} AS booked,
          CASE WHEN s.capacity > 0
            THEN CAST(${BOOKED_SEATS} AS REAL) / s.capacity ELSE 0 END AS fillRate
        FROM event_schedules s
          JOIN events e ON e.id = s.event_id
          LEFT JOIN event_bookings b
            ON b.event_schedule_id = s.id AND b.status != 'cancelled'
        WHERE s.start_at > ${nowSec}
        GROUP BY s.id
        ORDER BY s.start_at ASC
        LIMIT ${limit}
      `),
    );
  }
}

/** Cancelled bookings release their seats, so they never count as booked. */
const BOOKED_SEATS = sql`COALESCE(SUM(b.quantity), 0)`;
