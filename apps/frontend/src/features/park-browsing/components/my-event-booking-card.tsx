import { CalendarDays, FerrisWheel, Ticket, Users } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  EVENT_BOOKING_STATUS_LABELS,
  EVENT_BOOKING_STATUS_VARIANTS,
  gbp,
} from "../constants";
import type { EventBooking } from "../types";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyEventBookingCard({ booking }: { booking: EventBooking }) {
  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{booking.eventName}</h3>
              <Badge variant={EVENT_BOOKING_STATUS_VARIANTS[booking.status]}>
                {EVENT_BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <FerrisWheel className="size-3.5" />
              Activity booking
            </p>
          </div>
          <p className="text-lg font-semibold">
            {gbp(Number(booking.totalAmount))}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Starts
            </p>
            <p className="mt-0.5 font-medium">
              {formatDateTime(booking.startAt)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              Seats
            </p>
            <p className="mt-0.5 font-medium">{booking.quantity}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <span className="font-mono text-xs text-muted-foreground">
            Ref: {booking.bookingReference}
          </span>
          {/* The park ticket that admitted this booking — the prerequisite made visible. */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ticket className="size-3.5" />
            Uses ticket {booking.ticketReference}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
