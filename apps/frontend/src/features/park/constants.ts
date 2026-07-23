import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "~/components/ui/badge";
import type {
  EventBookingStatus,
  EventType,
  LocationType,
  TicketChannel,
  TicketStatus,
} from "./types";

export { gbp } from "~/features/reports/constants";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** The park's accent token, already used by the public theme-park page. */
export const PARK_SERIES_COLOR = "var(--series-park)";

export const EVENT_TYPES: EventType[] = ["ride", "show", "beach_event"];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  ride: "Ride",
  show: "Show",
  beach_event: "Beach event",
};

export const LOCATION_TYPES: LocationType[] = ["theme_park", "beach"];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  theme_park: "Theme park",
  beach: "Beach",
};

export const TICKET_STATUSES: TicketStatus[] = [
  "active",
  "used",
  "cancelled",
  "refunded",
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  active: "Active",
  used: "Checked in",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Semantic Badge variant per ticket status — never a literal color. */
export function ticketStatusBadgeVariant(status: TicketStatus): BadgeVariant {
  switch (status) {
    case "active":
      return "default";
    case "used":
      return "secondary";
    case "cancelled":
    case "refunded":
      return "destructive";
  }
}

export const TICKET_CHANNELS: TicketChannel[] = ["online", "gate"];

export const TICKET_CHANNEL_LABELS: Record<TicketChannel, string> = {
  online: "Online",
  gate: "Gate",
};

export const EVENT_BOOKING_STATUSES: EventBookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
];

export const EVENT_BOOKING_STATUS_LABELS: Record<EventBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export function eventBookingStatusBadgeVariant(
  status: EventBookingStatus,
): BadgeVariant {
  switch (status) {
    case "pending":
      return "outline";
    case "confirmed":
      return "default";
    case "cancelled":
      return "destructive";
  }
}

/** A schedule/day at or above this fill is flagged as nearly sold out. */
export const NEAR_CAPACITY_THRESHOLD = 0.9;

/** `2026-07-15` — the key the park API speaks in for whole days. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
