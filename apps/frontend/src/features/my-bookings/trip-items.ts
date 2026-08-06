/**
 * A guest's four booking kinds, flattened into one shape.
 *
 * The "My bookings" page spans hotel, ferry, park and event bookings, each with
 * its own API type, status enum and label map. Anything that reasons across all
 * four — what's happening next, what needs the guest's attention, what the trip
 * cost — would otherwise need a four-way branch at every step. Normalising once
 * here keeps that logic in a single, testable place; the per-domain tabs still
 * render their own detailed cards from the original types.
 */

import type { LinkProps } from "@tanstack/react-router";
import type { VariantProps } from "class-variance-authority";
import {
  BedDouble,
  CalendarClock,
  CircleAlert,
  FerrisWheel,
  Hourglass,
  Ship,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import type { badgeVariants } from "~/components/ui/badge";
import type { FerryBooking } from "~/features/ferry/bookings-types";
import {
  FERRY_BOOKING_STATUS_LABELS,
  FERRY_DIRECTION_LABELS,
  ferryBookingStatusBadgeVariant,
} from "~/features/ferry/constants";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
} from "~/features/hotel-browsing/constants";
import type { HotelBooking } from "~/features/hotel-browsing/types";
import {
  EVENT_BOOKING_STATUS_LABELS,
  EVENT_BOOKING_STATUS_VARIANTS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_VARIANTS,
  utcDateKey,
} from "~/features/park-browsing/constants";
import type { EventBooking, ParkTicket } from "~/features/park-browsing/types";

export type TripDomain = "hotel" | "ferry" | "park" | "event";

/**
 * Taken from the component rather than restated, so a domain's own status
 * helper can hand its variant straight through without a widening cast.
 */
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface TripItem {
  /** Unique across domains — ids collide between tables. */
  key: string;
  domain: TripDomain;
  id: number;
  title: string;
  detail: string;
  reference: string;
  amount: number;
  /** A complimentary ferry pass reads "Free", not "£0.00". */
  free: boolean;
  /** When the thing happens — the sort key for the merged timeline. */
  startAt: Date;
  /** Only a stay spans days; everything else is a moment in time. */
  endAt: Date | null;
  statusLabel: string;
  badgeVariant: BadgeVariant;
  /** Cancelled/refunded rows are excluded from spend, alerts and next-up. */
  live: boolean;
  /**
   * The boarding/entry reference, set only once the pass actually exists.
   * Presenting one for a booking still awaiting approval sends the guest to a
   * gate that turns them away, so the per-domain cards gate on the same
   * condition.
   */
  code: string | null;
}

export const DOMAIN_LABELS: Record<TripDomain, string> = {
  hotel: "Stay",
  ferry: "Ferry",
  park: "Park ticket",
  event: "Activity",
};

/**
 * Per-domain accent, drawn from the colourblind-safe `--series-*` ramp.
 * Class names are written out in full because Tailwind scans source text —
 * a template literal like `bg-series-${domain}` would emit nothing.
 */
export const DOMAIN_ACCENT: Record<
  TripDomain,
  { spine: string; chip: string; icon: LucideIcon }
> = {
  hotel: {
    spine: "bg-series-hotel",
    chip: "bg-series-hotel/15 text-series-hotel",
    icon: BedDouble,
  },
  ferry: {
    spine: "bg-series-ferry",
    chip: "bg-series-ferry/15 text-series-ferry",
    icon: Ship,
  },
  park: {
    spine: "bg-series-park",
    chip: "bg-series-park/20 text-series-park",
    icon: Ticket,
  },
  event: {
    spine: "bg-series-event",
    chip: "bg-series-event/15 text-series-event",
    icon: FerrisWheel,
  },
};

/** Complimentary passes carry an `FC-` reference; paid ones are `FB-`. */
const isComplimentary = (reference: string) => reference.startsWith("FC-");

function hotelItem(b: HotelBooking): TripItem {
  return {
    key: `hotel-${b.id}`,
    domain: "hotel",
    id: b.id,
    title: b.hotelName,
    detail: `${b.roomTypeName} · ${b.guests} guest${b.guests === 1 ? "" : "s"}`,
    reference: b.bookingReference,
    amount: Number(b.totalAmount),
    free: false,
    startAt: new Date(b.checkIn),
    endAt: new Date(b.checkOut),
    statusLabel: BOOKING_STATUS_LABELS[b.status],
    badgeVariant: BOOKING_STATUS_VARIANTS[b.status],
    live: b.status === "pending" || b.status === "confirmed",
    code: null,
  };
}

function ferryItem(b: FerryBooking): TripItem {
  const complimentary = isComplimentary(b.bookingReference);
  return {
    key: `ferry-${b.id}`,
    domain: "ferry",
    id: b.id,
    title: `${b.origin} → ${b.destination}`,
    detail: `${FERRY_DIRECTION_LABELS[b.direction]} · ${b.passengerCount} passenger${
      b.passengerCount === 1 ? "" : "s"
    }`,
    reference: b.bookingReference,
    amount: Number(b.totalAmount),
    free: complimentary,
    startAt: new Date(b.departureAt),
    endAt: null,
    statusLabel: FERRY_BOOKING_STATUS_LABELS[b.status],
    badgeVariant: ferryBookingStatusBadgeVariant(b.status),
    live: b.status === "pending" || b.status === "confirmed",
    code: b.status === "confirmed" ? b.bookingReference : null,
  };
}

function parkItem(t: ParkTicket): TripItem {
  return {
    key: `park-${t.id}`,
    domain: "park",
    id: t.id,
    title: t.ticketTypeName,
    detail: `Park entry · ${t.quantity} guest${t.quantity === 1 ? "" : "s"}`,
    reference: t.ticketReference,
    amount: Number(t.totalAmount),
    free: false,
    startAt: new Date(t.visitDate),
    endAt: null,
    statusLabel: TICKET_STATUS_LABELS[t.status],
    badgeVariant: TICKET_STATUS_VARIANTS[t.status],
    live: t.status === "active",
    code: t.status === "active" ? t.ticketReference : null,
  };
}

function eventItem(b: EventBooking): TripItem {
  return {
    key: `event-${b.id}`,
    domain: "event",
    id: b.id,
    title: b.eventName,
    detail: `Activity · ${b.quantity} seat${b.quantity === 1 ? "" : "s"}`,
    reference: b.bookingReference,
    amount: Number(b.totalAmount),
    free: false,
    startAt: new Date(b.startAt),
    endAt: null,
    statusLabel: EVENT_BOOKING_STATUS_LABELS[b.status],
    badgeVariant: EVENT_BOOKING_STATUS_VARIANTS[b.status],
    live: b.status === "pending" || b.status === "confirmed",
    code: null,
  };
}

export interface TripSources {
  hotels: HotelBooking[];
  ferry: FerryBooking[];
  tickets: ParkTicket[];
  events: EventBooking[];
}

/** Every booking as one chronological list, soonest first. */
export function toTripItems(sources: TripSources): TripItem[] {
  return [
    ...sources.hotels.map(hotelItem),
    ...sources.ferry.map(ferryItem),
    ...sources.tickets.map(parkItem),
    ...sources.events.map(eventItem),
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

/**
 * A stay counts as upcoming until the guest checks *out* — mid-trip, the stay
 * is the most relevant thing they have, not a past one. Everything else is
 * upcoming only until it starts.
 */
export function isUpcoming(item: TripItem, now: number): boolean {
  if (!item.live) return false;
  return (item.endAt ?? item.startAt).getTime() >= now;
}

export interface TripPulse {
  upcomingCount: number;
  totalSpend: number;
  nights: number;
}

export function tripPulse(items: TripItem[], now: number): TripPulse {
  const nights = items
    .filter((i) => i.domain === "hotel" && i.live && i.endAt)
    .reduce((sum, i) => {
      const ms = i.endAt!.getTime() - i.startAt.getTime();
      return sum + Math.max(0, Math.round(ms / 86_400_000));
    }, 0);

  return {
    upcomingCount: items.filter((i) => isUpcoming(i, now)).length,
    // Cancelled bookings were refunded or never charged — counting them would
    // overstate what the trip actually cost.
    totalSpend: items
      .filter((i) => i.live && !i.free)
      .reduce((sum, i) => sum + i.amount, 0),
    nights,
  };
}

/**
 * The single most imminent thing. A stay already under way outranks a sailing
 * later this week, so in-progress items sort ahead of ones yet to begin.
 */
export function nextUp(items: TripItem[], now: number): TripItem | null {
  const live = items.filter((i) => isUpcoming(i, now));
  if (live.length === 0) return null;

  const started = live.filter((i) => i.startAt.getTime() <= now);
  if (started.length > 0) {
    return started.reduce((a, b) =>
      (a.endAt ?? a.startAt).getTime() <= (b.endAt ?? b.startAt).getTime()
        ? a
        : b,
    );
  }
  return live.reduce((a, b) =>
    a.startAt.getTime() <= b.startAt.getTime() ? a : b,
  );
}

export type AlertTone = "urgent" | "info";

export interface TripAlert {
  key: string;
  tone: AlertTone;
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: { label: string; to: LinkProps["to"] };
}

/** Below this, the free-cancellation window is worth surfacing as urgent. */
const CANCEL_WARNING_HOURS = 72;
/** Backend rule: a stay can be cancelled up to 48h before check-in. */
const CANCEL_CUTOFF_HOURS = 48;

const HOURS = 60 * 60 * 1000;

/**
 * Things the guest may need to act on, derived entirely from data the page has
 * already loaded. Ordered urgent-first so the rail's top row is the one that
 * actually has a deadline.
 */
export function tripAlerts(sources: TripSources, now: number): TripAlert[] {
  const alerts: TripAlert[] = [];

  for (const b of sources.hotels) {
    if (b.status !== "pending" && b.status !== "confirmed") continue;
    const hoursLeft = (new Date(b.checkIn).getTime() - now) / HOURS;
    if (hoursLeft < CANCEL_CUTOFF_HOURS || hoursLeft > CANCEL_WARNING_HOURS) {
      continue;
    }
    const window = Math.floor(hoursLeft - CANCEL_CUTOFF_HOURS);
    alerts.push({
      key: `cancel-${b.id}`,
      tone: "urgent",
      icon: CalendarClock,
      title: "Free cancellation ending",
      detail: `${b.hotelName} can be cancelled free for another ${window} hour${
        window === 1 ? "" : "s"
      }.`,
    });
  }

  for (const b of sources.ferry) {
    if (b.status !== "pending") continue;
    alerts.push({
      key: `ferry-pending-${b.id}`,
      tone: "info",
      icon: Hourglass,
      title: "Ferry pass being checked",
      detail: `${b.origin} → ${b.destination}. Your pass appears here once the stay is verified.`,
    });
  }

  for (const b of sources.hotels) {
    if (b.status !== "pending") continue;
    alerts.push({
      key: `hotel-pending-${b.id}`,
      tone: "info",
      icon: Hourglass,
      title: "Stay awaiting confirmation",
      detail: `${b.hotelName} is not confirmed yet.`,
    });
  }

  /*
   * A park ticket admits entry for a day; rides and shows are booked against
   * it. A ticket for a day with nothing booked is the gap worth pointing at —
   * matched in UTC because the backend treats park days as whole UTC days.
   */
  const bookedDays = new Set(
    sources.events
      .filter((e) => e.status !== "cancelled")
      .map((e) => utcDateKey(e.startAt)),
  );
  for (const t of sources.tickets) {
    if (t.status !== "active") continue;
    if (new Date(t.visitDate).getTime() < now) continue;
    if (bookedDays.has(utcDateKey(t.visitDate))) continue;
    alerts.push({
      key: `empty-day-${t.id}`,
      tone: "info",
      icon: CircleAlert,
      title: "A park day with nothing booked",
      detail: `Your ${new Date(t.visitDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })} ticket has no rides or shows against it.`,
      action: { label: "See what's on", to: "/theme-park" },
    });
  }

  return alerts.sort((a, b) =>
    a.tone === b.tone ? 0 : a.tone === "urgent" ? -1 : 1,
  );
}

/**
 * "in 3 days", "in 6 hours". Deliberately coarse: this is a sense of how soon,
 * not a clock, and the exact date always sits next to it.
 */
export function untilLabel(target: Date, now: number): string {
  const ms = target.getTime() - now;
  if (ms <= 0) return "under way";

  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `in ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;

  const days = Math.floor(hours / 24);
  if (days < 14) return `in ${days} days`;

  const weeks = Math.round(days / 7);
  return `in ${weeks} weeks`;
}
