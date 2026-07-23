import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lt, lte, ne, sql } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  parkDayCapacities,
  parkTickets,
  type ParkDayCapacity,
} from '../../shared/database/schema';

/** Tickets already sold for one visit day, keyed `2026-07-15`. */
export interface SoldPerDayRow {
  date: string;
  sold: number;
}

export interface UpsertParkDayInput {
  capacity: number;
  isClosed: boolean;
  note: string | null;
}

/** Sole owner of Drizzle queries for per-day park capacity overrides. */
@Injectable()
export class ParkDaysRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findByRange(from: Date, to: Date): Promise<ParkDayCapacity[]> {
    return Promise.resolve(
      this.db
        .select()
        .from(parkDayCapacities)
        .where(
          and(
            gte(parkDayCapacities.date, from),
            lte(parkDayCapacities.date, to),
          ),
        )
        .orderBy(asc(parkDayCapacities.date))
        .all(),
    );
  }

  findByDate(date: Date): Promise<ParkDayCapacity | undefined> {
    return Promise.resolve(
      this.db
        .select()
        .from(parkDayCapacities)
        .where(eq(parkDayCapacities.date, date))
        .get(),
    );
  }

  /**
   * A visit date is a *day*, but `visit_date` is a timestamp column and not
   * every writer normalises it to midnight. Matching the instant exactly would
   * silently miss any ticket stored with a time on it — and a ticket missing
   * from `sold` is a ticket the capacity check lets us oversell. So compare on
   * the calendar day, and bound the scan by a half-open range so the index on
   * `visit_date` still gets used.
   */
  private readonly visitDay = sql<string>`date(${parkTickets.visitDate}, 'unixepoch')`;

  private readonly soldQuantity = sql<number>`COALESCE(SUM(${parkTickets.quantity}), 0)`;

  /** Tickets sold per day across a range. Cancelled tickets free their seats back up. */
  soldByRange(from: Date, to: Date): Promise<SoldPerDayRow[]> {
    return Promise.resolve(
      this.db
        .select({ date: this.visitDay, sold: this.soldQuantity })
        .from(parkTickets)
        .where(
          and(
            gte(parkTickets.visitDate, from),
            lt(parkTickets.visitDate, dayAfter(to)),
            ne(parkTickets.status, 'cancelled'),
          ),
        )
        .groupBy(this.visitDay)
        .all(),
    );
  }

  /** Tickets sold for a single day. Used to stop a cap being set below what's already out. */
  soldOnDate(date: Date): Promise<number> {
    const row = this.db
      .select({ sold: this.soldQuantity })
      .from(parkTickets)
      .where(
        and(
          gte(parkTickets.visitDate, date),
          lt(parkTickets.visitDate, dayAfter(date)),
          ne(parkTickets.status, 'cancelled'),
        ),
      )
      .get();
    return Promise.resolve(row?.sold ?? 0);
  }

  /** Create the override, or replace it if the day already has one. */
  upsert(date: Date, data: UpsertParkDayInput): Promise<ParkDayCapacity> {
    return Promise.resolve(
      this.db
        .insert(parkDayCapacities)
        .values({ date, ...data })
        .onConflictDoUpdate({
          target: parkDayCapacities.date,
          set: { ...data, updatedAt: new Date() },
        })
        .returning()
        .get(),
    );
  }

  deleteByDate(date: Date): Promise<void> {
    this.db
      .delete(parkDayCapacities)
      .where(eq(parkDayCapacities.date, date))
      .run();
    return Promise.resolve();
  }
}

/** Exclusive upper bound for "this whole calendar day". */
function dayAfter(date: Date): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
