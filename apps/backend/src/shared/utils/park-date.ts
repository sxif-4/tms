/**
 * Park dates are whole days, not instants. Both `park_tickets.visit_date` and
 * `park_day_capacities.date` store a UTC-midnight timestamp, so every date that
 * crosses the API boundary is normalised here — otherwise the unique constraint
 * on `park_day_capacities.date` and the "sold on day X" lookups would miss each
 * other by a few hours.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** `2026-07-15` (and only that shape) → true. */
export function isDateKey(value: string): boolean {
  return DATE_KEY.test(value) && !Number.isNaN(new Date(value).getTime());
}

/** Truncates any date/ISO string down to UTC midnight of that calendar day. */
export function utcMidnight(value: string | Date): Date {
  const date = typeof value === 'string' ? new Date(value) : new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/** UTC-midnight Date → `2026-07-15`, the key the API speaks in. */
export function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** True when both instants fall on the same UTC calendar day. */
export function isSameUtcDay(a: Date, b: Date): boolean {
  return utcMidnight(a).getTime() === utcMidnight(b).getTime();
}

/** Every UTC-midnight day from `from` to `to`, inclusive. Empty if `to < from`. */
export function eachUtcDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = utcMidnight(from);
  const last = utcMidnight(to);
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
