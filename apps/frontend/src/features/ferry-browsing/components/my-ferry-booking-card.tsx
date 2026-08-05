import { Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeftRight,
  CalendarDays,
  GiftIcon,
  Ship,
  Users,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  FERRY_BOOKING_STATUS_LABELS,
  FERRY_DIRECTION_LABELS,
  ferryBookingStatusBadgeVariant,
  gbp,
} from "~/features/ferry/constants";
import type { FerryBooking } from "~/features/ferry/bookings-types";

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Complimentary passes carry an `FC-` reference; paid ones are `FB-`. */
const isComplimentary = (reference: string) => reference.startsWith("FC-");

export function MyFerryBookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: FerryBooking;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const complimentary = isComplimentary(booking.bookingReference);
  /**
   * Only an issued pass gets a QR. Showing a scannable code for a booking still
   * awaiting approval sends the guest to a jetty that will turn them away.
   */
  const showQr = booking.status === "confirmed";
  const canCancel =
    booking.status === "pending" || booking.status === "confirmed";

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{booking.routeName}</h3>
              <Badge variant={ferryBookingStatusBadgeVariant(booking.status)}>
                {FERRY_BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
              {complimentary ? (
                <Badge variant="outline" className="gap-1">
                  <GiftIcon className="size-3" />
                  Included with your stay
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
              <Ship className="size-3.5" />
              {booking.origin} → {booking.destination} ·{" "}
              {FERRY_DIRECTION_LABELS[booking.direction]}
            </p>
          </div>
          <p className="font-medium tabular-nums">
            {complimentary ? "Free" : gbp(Number(booking.totalAmount))}
          </p>
        </div>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDateTime(booking.departureAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {booking.passengerCount} passenger
            {booking.passengerCount === 1 ? "" : "s"}
          </span>
        </div>

        {showQr ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed p-4">
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Show this at the jetty
            </p>
            {/* Dark-on-white regardless of theme — inverting a QR breaks scanners. */}
            <div className="rounded-md bg-white p-3">
              <QRCodeSVG
                value={booking.bookingReference}
                size={132}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
                aria-label={`QR code for ferry booking ${booking.bookingReference}`}
              />
            </div>
            <p className="font-mono text-lg font-semibold tracking-widest">
              {booking.bookingReference}
            </p>
          </div>
        ) : (
          <div className="text-muted-foreground mt-4 rounded-lg border border-dashed p-3 text-sm">
            {booking.status === "pending"
              ? "Our team is checking your hotel booking. Your pass appears here once issued."
              : booking.status === "cancelled" && complimentary
                ? "This included pass was replaced by a seat you booked yourself, or your stay was cancelled."
                : booking.status === "validated"
                  ? `Boarded${booking.validatedAt ? ` ${formatDateTime(booking.validatedAt)}` : ""}. Have a good trip.`
                  : "This booking was cancelled."}
            <span className="mt-1 block font-mono text-xs">
              {booking.bookingReference}
            </span>
          </div>
        )}

        {canCancel ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {/*
              The way out has to live here. A guest whose passes were issued
              automatically never went near the booking form, so this is the
              only place they will look to travel at another time.
            */}
            <p className="text-muted-foreground text-sm">
              {complimentary
                ? "Travelling at a different time?"
                : "Need a different sailing?"}
            </p>
            <div className="flex flex-wrap gap-2">
              {onCancel ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={cancelling}
                >
                  Cancel booking
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link to="/ferry/book">
                  <ArrowLeftRight data-icon="inline-start" />
                  Change sailing
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
