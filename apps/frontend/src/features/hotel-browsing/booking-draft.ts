import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

/**
 * The in-progress booking lives in the URL rather than in component state, so
 * it survives the /book → /login → /checkout round trip for free:
 * `redirect: location.href` already carries every field, and refresh, back and
 * "send this to my friend" all keep working.
 *
 * Dates are calendar days (`yyyy-MM-dd`), never `toISOString()`. The calendar
 * hands back local midnight, and serialising that as UTC lands on the previous
 * day anywhere east of Greenwich — including the UK for half the year.
 */
const calendarDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a yyyy-MM-dd date");

export const bookingDraftSchema = z.object({
  roomTypeId: z.coerce.number().int().positive().optional(),
  checkIn: calendarDay.optional(),
  checkOut: calendarDay.optional(),
  guests: z.coerce.number().int().min(1).max(20).optional(),
});

export type BookingDraft = z.infer<typeof bookingDraftSchema>;

/** A draft carrying everything `POST /hotel-bookings` requires. */
export type CompleteBookingDraft = {
  [K in keyof BookingDraft]-?: NonNullable<BookingDraft[K]>;
};

/**
 * A stay needs at least one night. `mode="range"` reports the first click as
 * `{ from: X, to: X }`, so a zero-night range is the normal state *between* the
 * two clicks — and the API 400s on it. Every availability lookup gates on this
 * rather than on the two fields merely being present.
 */
export function isValidStay(range: {
  checkIn?: string;
  checkOut?: string;
}): range is { checkIn: string; checkOut: string } {
  return Boolean(
    range.checkIn && range.checkOut && range.checkIn < range.checkOut,
  );
}

export function isCompleteDraft(
  draft: BookingDraft,
): draft is CompleteBookingDraft {
  return draft.roomTypeId != null && draft.guests != null && isValidStay(draft);
}

/** Calendar day for a `Date`, read in local time so the day never shifts. */
export const toCalendarDay = (date: Date) => format(date, "yyyy-MM-dd");

/** `parseISO` reads a bare `yyyy-MM-dd` as local midnight; `new Date()` doesn't. */
export const fromCalendarDay = (day: string) => parseISO(day);

export function draftToDateRange(draft: BookingDraft): DateRange | undefined {
  if (!draft.checkIn) return undefined;
  return {
    from: fromCalendarDay(draft.checkIn),
    to: draft.checkOut ? fromCalendarDay(draft.checkOut) : undefined,
  };
}

export function formatCalendarDay(day: string) {
  return fromCalendarDay(day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
