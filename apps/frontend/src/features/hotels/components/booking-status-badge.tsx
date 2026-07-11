import { Badge } from "~/components/ui/badge";
import { BOOKING_STATUS_LABELS, bookingStatusBadgeVariant } from "../constants";
import type { BookingStatus } from "../types";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={bookingStatusBadgeVariant(status)}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
