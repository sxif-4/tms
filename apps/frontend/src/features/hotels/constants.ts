import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "~/components/ui/badge";
import type { BookingStatus, RoomStatus } from "./types";

export { gbp } from "~/features/reports/constants";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const ROOM_STATUSES: RoomStatus[] = [
  "available",
  "occupied",
  "maintenance",
  "out_of_service",
];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  out_of_service: "Out of service",
};

/** Semantic Badge variant per room status — never a literal color. */
export function roomStatusBadgeVariant(status: RoomStatus): BadgeVariant {
  switch (status) {
    case "available":
      return "secondary";
    case "occupied":
      return "outline";
    case "maintenance":
    case "out_of_service":
      return "destructive";
  }
}

/** `2026-07-15` — the whole-day key the booking API speaks in. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DAY_MS = 86_400_000;

/**
 * The stay the desk screen opens on: tonight, one night. The route loader and
 * the page derive their dates from here so the prefetched availability lands on
 * the same query key and the room list is there on first paint.
 */
export function defaultStay(): { checkIn: string; checkOut: string } {
  const now = Date.now();
  return {
    checkIn: toDateKey(new Date(now)),
    checkOut: toDateKey(new Date(now + DAY_MS)),
  };
}

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** Semantic Badge variant per booking status — never a literal color. */
export function bookingStatusBadgeVariant(status: BookingStatus): BadgeVariant {
  switch (status) {
    case "pending":
      return "outline";
    case "confirmed":
      return "default";
    case "completed":
      return "secondary";
    case "cancelled":
      return "destructive";
  }
}
