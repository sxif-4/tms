import { FerrisWheel, Palmtree, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { z } from "zod";
import { gbp } from "~/features/reports/constants";
import type {
  EventBookingStatus,
  EventType,
  LocationType,
  PublicDayAvailability,
  TicketStatus,
} from "./types";

export { gbp };

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** Visitor-facing wording. Staff see the raw status; a buyer sees the outcome. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  active: "Valid",
  used: "Checked in",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const TICKET_STATUS_VARIANTS: Record<TicketStatus, BadgeVariant> = {
  active: "default",
  used: "outline",
  cancelled: "destructive",
  refunded: "destructive",
};

export const EVENT_BOOKING_STATUS_LABELS: Record<EventBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export const EVENT_BOOKING_STATUS_VARIANTS: Record<
  EventBookingStatus,
  BadgeVariant
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
};

/** Deep-linked from the ticket confirmation and the event pages. */
export const parkTicketsSearchSchema = z.object({
  /** `yyyy-MM-dd` — preselects the visit date. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type ParkTicketsSearch = z.infer<typeof parkTicketsSearchSchema>;

export const parkEventsSearchSchema = z.object({
  eventType: z.enum(["ride", "show", "beach_event"]).optional(),
  locationType: z.enum(["theme_park", "beach"]).optional(),
  /**
   * `yyyy-MM-dd` — the day the visitor is planning for, carried over from a
   * ticket purchase. Context only: the API has no date filter on events, so
   * this highlights matching schedules rather than narrowing the list.
   */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type ParkEventsSearch = z.infer<typeof parkEventsSearchSchema>;

/**
 * `2026-08-12T00:00:00.000Z` → `2026-08-12`. Park days are whole UTC days on
 * the backend (`toDateKey`/`isSameUtcDay`), so every "is this ticket for this
 * event's day?" comparison must be made in UTC — doing it in local time puts
 * anyone west of Greenwich on the wrong day.
 */
export function utcDateKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  ride: "Ride",
  show: "Show",
  beach_event: "Beach event",
};

/**
 * Stands in for the photo until staff upload one, so an unphotographed ride
 * still reads as a poster rather than a broken image.
 */
export const EVENT_ICONS: Record<EventType, LucideIcon> = {
  ride: FerrisWheel,
  show: Sparkles,
  beach_event: Palmtree,
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
