import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ParkReportsRepository,
  type EventReportRow,
  type SalesRow,
  type VisitorRow,
} from './park-reports.repository';

export const SALES_GROUP_BY = ['day', 'ticketType', 'channel'] as const;
export type SalesGroupBy = (typeof SALES_GROUP_BY)[number];

const DAY_SECONDS = 86_400;

@Injectable()
export class ParkReportsService {
  constructor(private readonly reportsRepo: ParkReportsRepository) {}

  sales(from?: string, to?: string, groupBy: SalesGroupBy = 'day') {
    const [fromSec, toSec] = this.range(from, to);
    switch (groupBy) {
      case 'ticketType':
        return this.reportsRepo.salesByTicketType(fromSec, toSec);
      case 'channel':
        return this.reportsRepo.salesByChannel(fromSec, toSec);
      case 'day':
        return this.reportsRepo.salesByDay(fromSec, toSec);
    }
  }

  visitors(from?: string, to?: string): Promise<VisitorRow[]> {
    const [fromSec, toSec] = this.range(from, to);
    return this.reportsRepo.visitors(fromSec, toSec);
  }

  events(from?: string, to?: string): Promise<EventReportRow[]> {
    const [fromSec, toSec] = this.range(from, to);
    return this.reportsRepo.events(fromSec, toSec);
  }

  /**
   * Defaults to the last 30 days through the next 30 — the same window the
   * hotel reports use, so past sales and upcoming schedules both show up.
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

export type { EventReportRow, SalesRow, VisitorRow };
