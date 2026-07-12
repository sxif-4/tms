import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import {
  eachUtcDay,
  toDateKey,
  utcMidnight,
} from '../../shared/utils/park-date';
import { UpsertParkDayDto } from './dto/upsert-park-day.dto';
import { ParkDaysRepository } from './park-days.repository';

/** One day of the availability calendar, as the API returns it. */
export interface ParkDayView {
  date: string;
  capacity: number;
  sold: number;
  remaining: number;
  isClosed: boolean;
  note: string | null;
  /** True when no override row exists — the day is running on the configured default. */
  isDefault: boolean;
}

/** A range wider than this is almost certainly a mistake, and would build a huge array. */
const MAX_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 30;

/**
 * Per-day ticket availability.
 *
 * A day with no `park_day_capacities` row is **open at the default capacity**,
 * not closed — staff insert a row only to override a specific day. That keeps
 * ops from having to seed 365 rows a year, and it's why the calendar below is
 * synthesised rather than read straight out of the table.
 */
@Injectable()
export class ParkDaysService {
  constructor(
    private readonly parkDaysRepo: ParkDaysRepository,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  private get defaultCapacity(): number {
    return this.config.get<number>('app.parkDefaultDailyCapacity') ?? 2000;
  }

  /** Every day in the range, override rows merged over the configured default. */
  async listRange(fromRaw?: string, toRaw?: string): Promise<ParkDayView[]> {
    const from = fromRaw
      ? this.parseDate(fromRaw, 'from')
      : utcMidnight(new Date());
    const to = toRaw
      ? this.parseDate(toRaw, 'to')
      : this.addDays(from, DEFAULT_RANGE_DAYS - 1);

    if (to.getTime() < from.getTime()) {
      throw new BadRequestException('"to" must not be before "from"');
    }
    const days = eachUtcDay(from, to);
    if (days.length > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `Range too wide — ask for at most ${MAX_RANGE_DAYS} days`,
      );
    }

    // Two range queries, then merge in memory — beats a per-day round trip.
    const [overrides, soldRows] = await Promise.all([
      this.parkDaysRepo.findByRange(from, to),
      this.parkDaysRepo.soldByRange(from, to),
    ]);

    const overrideByDate = new Map(
      overrides.map((row) => [toDateKey(row.date), row]),
    );
    // `row.date` is already a `2026-07-15` day key, grouped in SQL.
    const soldByDate = new Map(soldRows.map((row) => [row.date, row.sold]));

    return days.map((day) => {
      const key = toDateKey(day);
      const override = overrideByDate.get(key);
      const sold = soldByDate.get(key) ?? 0;
      const capacity = override?.capacity ?? this.defaultCapacity;

      return {
        date: key,
        capacity,
        sold,
        remaining: Math.max(0, capacity - sold),
        isClosed: override?.isClosed ?? false,
        note: override?.note ?? null,
        isDefault: !override,
      };
    });
  }

  /** Capacity/closure for a single day. Phase 2 ticket sales gate on this. */
  async availabilityFor(date: Date): Promise<ParkDayView> {
    const day = utcMidnight(date);
    const [override, sold] = await Promise.all([
      this.parkDaysRepo.findByDate(day),
      this.parkDaysRepo.soldOnDate(day),
    ]);
    const capacity = override?.capacity ?? this.defaultCapacity;

    return {
      date: toDateKey(day),
      capacity,
      sold,
      remaining: Math.max(0, capacity - sold),
      isClosed: override?.isClosed ?? false,
      note: override?.note ?? null,
      isDefault: !override,
    };
  }

  async upsert(
    dateRaw: string,
    dto: UpsertParkDayDto,
    actorId: number,
  ): Promise<ParkDayView> {
    const date = this.parseDate(dateRaw, 'date');

    // You can't cap a day below the tickets already sold for it — those visitors
    // are coming regardless. Closing it is allowed: that's a deliberate override
    // (refunds are then a staff decision, not something we silently block on).
    const sold = await this.parkDaysRepo.soldOnDate(date);
    if (dto.capacity < sold) {
      throw new BadRequestException(
        `Capacity cannot be below the ${sold} ticket(s) already sold for ${toDateKey(date)}`,
      );
    }

    const row = await this.parkDaysRepo.upsert(date, {
      capacity: dto.capacity,
      isClosed: dto.isClosed ?? false,
      note: dto.note ?? null,
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.ParkDayCapacityUpdated,
      subjectType: 'ParkDayCapacity',
      subjectId: row.id,
      metadata: {
        date: toDateKey(date),
        capacity: row.capacity,
        isClosed: row.isClosed,
      },
    });

    return this.availabilityFor(date);
  }

  /** Drop the override — the day reverts to the configured default capacity. */
  async clear(dateRaw: string, actorId: number): Promise<void> {
    const date = this.parseDate(dateRaw, 'date');

    const existing = await this.parkDaysRepo.findByDate(date);
    if (!existing) {
      throw new NotFoundException(
        `No capacity override set for ${toDateKey(date)}`,
      );
    }

    await this.parkDaysRepo.deleteByDate(date);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.ParkDayCapacityCleared,
      subjectType: 'ParkDayCapacity',
      subjectId: existing.id,
      metadata: { date: toDateKey(date) },
    });
  }

  private parseDate(value: string, field: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `"${field}" must be a date like 2026-07-15`,
      );
    }
    return utcMidnight(date);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }
}
