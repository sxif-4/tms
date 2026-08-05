import { Badge } from "~/components/ui/badge";
import {
  FERRY_BOOKING_STATUS_LABELS,
  FERRY_DIRECTION_LABELS,
  FERRY_SCHEDULE_STATUS_LABELS,
  HOTEL_STATUS_LABELS,
  ferryBookingStatusBadgeVariant,
  type FerryBookingStatus,
} from "../constants";
import type { FerryBooking } from "../bookings-types";
import type { FerrySchedule } from "../types";

export function FerryBookingStatusBadge({
  status,
}: {
  status: FerryBookingStatus;
}) {
  return (
    <Badge variant={ferryBookingStatusBadgeVariant(status)}>
      {FERRY_BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}

export function DirectionBadge({
  direction,
}: {
  direction: FerrySchedule["direction"];
}) {
  return <Badge variant="outline">{FERRY_DIRECTION_LABELS[direction]}</Badge>;
}

export function ScheduleStatusBadge({
  status,
}: {
  status: FerrySchedule["status"];
}) {
  return (
    <Badge variant={status === "scheduled" ? "secondary" : "destructive"}>
      {FERRY_SCHEDULE_STATUS_LABELS[status]}
    </Badge>
  );
}

/** The stay behind a ferry booking — the thing that authorises travel at all. */
export function HotelStatusBadge({
  status,
}: {
  status: FerryBooking["hotelStatus"];
}) {
  const eligible = status === "confirmed" || status === "completed";
  return (
    <Badge variant={eligible ? "secondary" : "destructive"}>
      {HOTEL_STATUS_LABELS[status]}
    </Badge>
  );
}
