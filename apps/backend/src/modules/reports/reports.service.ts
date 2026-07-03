import { Injectable } from '@nestjs/common';
import { ReportsRepository, type OverviewRow } from './reports.repository';

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

const DAY_SECONDS = 86_400;
const round2 = (n: number) => Math.round(n * 100) / 100;

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
