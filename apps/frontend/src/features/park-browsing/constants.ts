import { z } from "zod";
import { gbp } from "~/features/reports/constants";
import type { EventType, LocationType, PublicDayAvailability } from "./types";

export { gbp };

/** Deep-linked from the ticket confirmation and the event pages. */
export const parkTicketsSearchSchema = z.object({
  /** `yyyy-MM-dd` — preselects the visit date. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type ParkTicketsSearch = z.infer<typeof parkTicketsSearchSchema>;

export const parkEventsSearchSchema = z.object({
  eventType: z.enum(["ride", "show", "beach_event"]).optional(),
  locationType: z.enum(["theme_park", "beach"]).optional(),
});
export type ParkEventsSearch = z.infer<typeof parkEventsSearchSchema>;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  ride: "Ride",
  show: "Show",
  beach_event: "Beach event",
};

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  theme_park: "Theme park",
  beach: "Beach",
};

/**
 * Day states for the ticket date picker. Capacity is deliberately hidden from
 * visitors (the API returns only `remaining`), so "limited" is an absolute
 * threshold rather than a percentage of a number we're not allowed to see.
 */
export type ParkDayState = "available" | "limited" | "sold_out" | "closed";

/** Below this many tickets left, the day is flagged as selling out. */
const LIMITED_THRESHOLD = 100;

export function parkDayState(day: PublicDayAvailability): ParkDayState {
  if (day.isClosed) return "closed";
  if (day.remaining <= 0) return "sold_out";
  if (day.remaining <= LIMITED_THRESHOLD) return "limited";
  return "available";
}

/** Semantic tint per state — never a literal traffic-light colour. */
export const PARK_DAY_STATE_CLASS: Record<ParkDayState, string> = {
  available: "bg-series-park/70",
  limited: "bg-accent-foreground/60",
  sold_out: "bg-destructive/70",
  closed: "bg-muted",
};

/** Human label, so day state is never communicated by colour alone. */
export const PARK_DAY_STATE_LABEL: Record<ParkDayState, string> = {
  available: "Tickets available",
  limited: "Selling fast",
  sold_out: "Sold out",
  closed: "Park closed",
};

/** A day is unselectable when it's shut or has nothing left. */
export function isParkDayDisabled(day: PublicDayAvailability): boolean {
  return day.isClosed || day.remaining <= 0;
}
