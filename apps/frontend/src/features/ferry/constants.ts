import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "~/components/ui/badge";
import type { FerryBooking } from "./bookings-types";
import type { FerrySchedule } from "./types";

export { gbp } from "~/features/reports/constants";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type FerryBookingStatus = FerryBooking["status"];

/** The ferry's accent token, already used by the public ferry page. */
export const FERRY_SERIES_COLOR = "var(--series-ferry)";

/** Queue order: what needs work first, then what is done. */
export const FERRY_BOOKING_STATUSES: FerryBookingStatus[] = [
  "pending",
  "confirmed",
  "validated",
  "cancelled",
];

export const FERRY_BOOKING_STATUS_LABELS: Record<FerryBookingStatus, string> = {
  pending: "Awaiting pass",
  confirmed: "Pass issued",
  validated: "Boarded",
  cancelled: "Cancelled",
};

/** Semantic Badge variant per booking status — never a literal color. */
export function ferryBookingStatusBadgeVariant(
  status: FerryBookingStatus,
): BadgeVariant {
  switch (status) {
    case "pending":
      return "outline";
    case "confirmed":
      return "default";
    case "validated":
      return "secondary";
    case "cancelled":
      return "destructive";
  }
}

export const FERRY_DIRECTION_LABELS: Record<
  FerrySchedule["direction"],
  string
> = {
  to_theme_park: "To theme park",
  to_island: "To island",
};

export const FERRY_SCHEDULE_STATUS_LABELS: Record<
  FerrySchedule["status"],
  string
> = {
  scheduled: "Scheduled",
  departed: "Departed",
  cancelled: "Cancelled",
};

export const HOTEL_STATUS_LABELS: Record<FerryBooking["hotelStatus"], string> =
  {
    pending: "Unpaid",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
  };

/**
 * The stay statuses the API accepts as authorising ferry travel. Mirrors
 * FERRY_ELIGIBLE_HOTEL_STATUSES in the backend service — kept in sync by hand,
 * and only used to explain eligibility in the UI, never to bypass the check.
 */
export const FERRY_ELIGIBLE_HOTEL_STATUSES: FerryBooking["hotelStatus"][] = [
  "confirmed",
  "completed",
];
