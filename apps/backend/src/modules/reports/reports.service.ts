import { Injectable } from '@nestjs/common';
import {
  ReportsRepository,
  type OperationsRow,
  type OverviewRow,
} from './reports.repository';

export interface SalesPoint {
  date: string;
  hotel: number;
  ferry: number;
  park: number;
  event: number;
}

export interface UsagePoint {
  domain: 'ferry' | 'event';
  capacity: number;
  booked: number;
  /** Percentage, one decimal place. */
  utilization: number;
}

/** One hotel's forward occupancy. */
export interface OccupancyPoint {
  hotelId: number;
  hotelName: string;
  rooms: number;
  roomNightsBooked: number;
  roomNightsAvailable: number;
  /** Percentage, one decimal place. */
  occupancy: number;
}

/** An upcoming sailing or event and how full it is. */
export interface ScheduleFillPoint {
  domain: 'ferry' | 'event';
  id: number;
  label: string;
  detail: string;
  startAt: string;
  capacity: number;
  booked: number;
  /** Percentage, one decimal place. */
  fillRate: number;
}

const DAY_SECONDS = 86_400;
/** How far ahead the overview looks for occupancy and departures. */
const OCCUPANCY_WINDOW_DAYS = 30;
const SCHEDULE_WINDOW_DAYS = 7;
const TOP_HOTELS_LIMIT = 6;

const round2 = (n: number) => Math.round(n * 100) / 100;
const percent = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepo: ReportsRepository) {}

  overview(): Promise<OverviewRow> {
    return this.reportsRepo.overview();
  }

  async sales(from?: string, to?: string): Promise<SalesPoint[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = from
      ? Math.floor(new Date(from).getTime() / 1000)
      : nowSec - 30 * DAY_SECONDS;
    const toSec = to
      ? Math.floor(new Date(to).getTime() / 1000)
      : nowSec + 30 * DAY_SECONDS;

    const rows = await this.reportsRepo.salesByServiceDate(fromSec, toSec);

    // Pivot (day, domain) rows into one point per day.
    const byDay = new Map<string, SalesPoint>();
    for (const r of rows) {
      let point = byDay.get(r.day);
      if (!point) {
        point = { date: r.day, hotel: 0, ferry: 0, park: 0, event: 0 };
        byDay.set(r.day, point);
      }
      point[r.domain] = round2(r.revenue);
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  /** Attention tiles for the admin overview. */
  async operations(): Promise<OperationsRow> {
    const row = await this.reportsRepo.operations();
    return {
      ...row,
      pendingPaymentAmount: round2(row.pendingPaymentAmount),
      refundedAmount: round2(row.refundedAmount),
    };
  }

  /**
   * Forward occupancy per hotel, busiest first. Looks ahead rather than back —
   * the question an admin has on landing is what the next month looks like,
   * not what last month did.
   */
  async occupancy(): Promise<OccupancyPoint[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const rows = await this.reportsRepo.occupancy(
      nowSec,
      nowSec + OCCUPANCY_WINDOW_DAYS * DAY_SECONDS,
      TOP_HOTELS_LIMIT,
    );
    return rows.map((r) => ({
      ...r,
      roomNightsBooked: round2(r.roomNightsBooked),
      occupancy: percent(r.roomNightsBooked, r.roomNightsAvailable),
    }));
  }

  /** Sailings and events departing in the next week, soonest first. */
  async scheduleFill(): Promise<ScheduleFillPoint[]> {
    const nowSec = Math.floor(Date.now() / 1000);
    const rows = await this.reportsRepo.scheduleFill(
      nowSec,
      nowSec + SCHEDULE_WINDOW_DAYS * DAY_SECONDS,
    );
    return rows.map((r) => ({
      domain: r.domain,
      id: r.id,
      label: r.label,
      detail: r.detail,
      startAt: new Date(r.startAt * 1000).toISOString(),
      capacity: r.capacity,
      booked: r.booked,
      fillRate: percent(r.booked, r.capacity),
    }));
  }

  async usage(): Promise<UsagePoint[]> {
    const rows = await this.reportsRepo.usage();
    return rows.map((r) => ({
      domain: r.domain,
      capacity: r.capacity,
      booked: r.booked,
      utilization:
        r.capacity > 0 ? Math.round((r.booked / r.capacity) * 1000) / 10 : 0,
    }));
  }
}
