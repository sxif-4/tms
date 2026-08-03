import { Badge } from "~/components/ui/badge";
import { BOOKING_STATUS_LABELS, bookingStatusBadgeVariant } from "../constants";
import type { BookingStatus } from "../types";

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  /** Lets a page scale the badge up when status is a headline fact. */
  className?: string;
}) {
  return (
    <Badge className={className} variant={bookingStatusBadgeVariant(status)}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
