import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Hotel as HotelIcon,
  Mail,
  Users,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { gbp } from "../constants";
import { myHotelBookingsQueryOptions } from "../queries";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function HotelBookingConfirmationPage({
  hotelId,
  reference,
}: {
  hotelId: number;
  reference?: string;
}) {
  const { data: bookings } = useSuspenseQuery(myHotelBookingsQueryOptions);
  const booking = reference
    ? bookings.find((b) => b.bookingReference === reference)
    : bookings[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-9 text-primary" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Booking confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you{booking ? `, ${booking.guestName.split(" ")[0]}` : ""}. Your
          reservation is set.
        </p>
      </div>

      <Card className="glass-data-strong mt-10 overflow-hidden">
        <CardHeader className="border-b bg-transparent">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Booking reference</span>
            <span className="font-mono text-lg tracking-wide text-primary">
              {reference ?? booking?.bookingReference ?? "—"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {booking ? (
            <>
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-medium">
                  <HotelIcon className="size-4 text-primary" />
                  {booking.hotelName}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BedDouble className="size-4" />
                  {booking.roomTypeName}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Check-in
                  </p>
                  <p className="mt-1 font-medium">{formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Check-out
                  </p>
                  <p className="mt-1 font-medium">{formatDate(booking.checkOut)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-4" />
                    Guests
                  </p>
                  <p className="mt-1 font-medium">{booking.guests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total paid</p>
                  <p className="mt-1 font-semibold">{gbp(Number(booking.totalAmount))}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  We&apos;ve sent a confirmation to{" "}
                  <span className="font-medium">{booking.guestEmail}</span>.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Booking details are no longer available. Check your email for the
              confirmation.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/my-bookings">View my bookings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/hotels/$hotelId" params={{ hotelId: String(hotelId) }}>
            Back to hotel
          </Link>
        </Button>
      </div>
    </div>
  );
}
