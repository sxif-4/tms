import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FerryReportsRepository,
  PERIOD_BUCKETS,
  type FerryRouteReportRow,
  type FerrySalesRow,
  type FerryTripRow,
  type PeriodBucket,
} from './ferry-reports.repository';

const DAY_SECONDS = 86_400;

export interface FerryTripReportRow extends FerryTripRow {
  loadFactor: number;
  /**
   * Booked but never boarded. Only meaningful once a sailing has gone — a
   * scheduled sailing has passengers who have not boarded *yet*, which is not
   * the same thing, so it reports null.
   */
  noShows: number | null;
}

export interface FerryRouteReportView extends FerryRouteReportRow {
  averageLoad: number;
}

@Injectable()
export class FerryReportsService {
  constructor(private readonly reportsRepo: FerryReportsRepository) {}

  sales(from?: string, to?: string, groupBy: PeriodBucket = 'day') {
    const [fromSec, toSec] = this.range(from, to);
    return this.reportsRepo.sales(fromSec, toSec, groupBy);
  }

  async trips(
    from?: string,
    to?: string,
    routeId?: number,
  ): Promise<FerryTripReportRow[]> {
    const [fromSec, toSec] = this.range(from, to);
    const rows = await this.reportsRepo.trips(fromSec, toSec, routeId);

    return rows.map((row) => ({
      ...row,
      loadFactor: rate(row.booked, row.capacity),
      noShows:
        row.status === 'departed'
          ? Math.max(row.booked - row.validated, 0)
          : null,
    }));
  }

  async routes(from?: string, to?: string): Promise<FerryRouteReportView[]> {
    const [fromSec, toSec] = this.range(from, to);
    const rows = await this.reportsRepo.routes(fromSec, toSec);

    return rows.map((row) => ({
      ...row,
      averageLoad: rate(row.passengers, row.capacity),
    }));
  }

  /**
   * Defaults to the last 30 days through the next 30 — the same window the
   * hotel and park reports use, so past sales and upcoming sailings both show.
   */
  private range(from?: string, to?: string): [number, number] {
    const nowSec = Math.floor(Date.now() / 1000);
    const fromSec = from
      ? Math.floor(this.parseDate(from, 'from').getTime() / 1000)
      : nowSec - 30 * DAY_SECONDS;
    const toSec = to
      ? Math.floor(this.parseDate(to, 'to').getTime() / 1000)
      : nowSec + 30 * DAY_SECONDS;
    if (toSec < fromSec) {
      throw new BadRequestException('"to" must not be before "from"');
    }
    return [fromSec, toSec];
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`"${field}" must be a valid date`);
    }
    return date;
  }
}

/** Percentage with one decimal, matching every other dashboard and report. */
function rate(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export { PERIOD_BUCKETS };
export type { FerrySalesRow, PeriodBucket };
