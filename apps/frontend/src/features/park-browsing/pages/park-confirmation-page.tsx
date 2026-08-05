import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  FerrisWheel,
  Mail,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { ParkTicketQr } from "../components/park-ticket-qr";
import { gbp, utcDateKey } from "../constants";
import {
  myEventBookingsQueryOptions,
  myParkTicketsQueryOptions,
} from "../queries";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One confirmation screen for both park purchases. The reference prefix says
 * which it is — `PT-` for a park ticket, `EB-` for an event booking — so the
 * event-bookings query only runs when it's actually needed.
 */
export function ParkConfirmationPage({ reference }: { reference?: string }) {
  const isEventBooking = reference?.startsWith("EB-") ?? false;

  const { data: tickets } = useSuspenseQuery(myParkTicketsQueryOptions);
  const { data: eventBookings = [] } = useQuery({
    ...myEventBookingsQueryOptions,
    enabled: isEventBooking,
  });

  const ticket = isEventBooking
    ? undefined
    : reference
      ? tickets.find((t) => t.ticketReference === reference)
      : tickets[0];
  const booking = isEventBooking
    ? eventBookings.find((b) => b.bookingReference === reference)
    : undefined;

  const visitorName = ticket?.buyerName ?? booking?.visitorName;
  const visitorEmail = ticket?.buyerEmail ?? booking?.visitorEmail;
  const shownReference =
    reference ?? ticket?.ticketReference ?? booking?.bookingReference ?? "—";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-series-park/15">
          <CheckCircle2 className="size-9 text-series-park" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          {isEventBooking ? "Seats booked!" : "Tickets confirmed!"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you{visitorName ? `, ${visitorName.split(" ")[0]}` : ""}.
          {isEventBooking
            ? " Your seats are reserved."
            : " We'll see you at the gate."}
        </p>
      </div>

      <Card className="glass-data-strong mt-10 overflow-hidden">
        <CardHeader className="border-b bg-transparent">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>
              {isEventBooking ? "Booking reference" : "Ticket reference"}
            </span>
            <span className="font-mono text-lg tracking-wide text-series-park">
              {shownReference}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {ticket ? (
            <>
              <p className="flex items-center gap-2 font-medium">
                <Ticket className="size-4 text-series-park" />
                {ticket.ticketTypeName}
              </p>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Visit date
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDate(ticket.visitDate)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-4" />
                    Guests
                  </p>
                  <p className="mt-1 font-medium">{ticket.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total paid</p>
                  <p className="mt-1 font-semibold">
                    {gbp(Number(ticket.totalAmount))}
                  </p>
                </div>
              </div>
              <ParkTicketQr reference={ticket.ticketReference} />
            </>
          ) : booking ? (
            <>
              <p className="flex items-center gap-2 font-medium">
                <FerrisWheel className="size-4 text-series-park" />
                {booking.eventName}
              </p>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Starts
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDateTime(booking.startAt)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-4" />
                    Seats
                  </p>
                  <p className="mt-1 font-medium">{booking.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total paid</p>
                  <p className="mt-1 font-semibold">
                    {gbp(Number(booking.totalAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Park ticket</p>
                  <p className="mt-1 font-mono text-sm">
                    {booking.ticketReference}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              These details are no longer available. Check your email for the
              confirmation.
            </p>
          )}

          {visitorEmail && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <Mail className="mt-0.5 size-4 shrink-0 text-series-park" />
              <p>
                We&apos;ve sent a confirmation to{" "}
                <span className="font-medium">{visitorEmail}</span>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {ticket && (
        <div className="mt-6 rounded-xl border border-series-park/30 bg-series-park/5 p-5">
          <p className="font-medium">
            Now book rides &amp; shows for {formatDate(ticket.visitDate)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your park ticket covers entry. Rides, shows and beach events are
            booked separately — and they fill up.
          </p>
          <Button asChild className="mt-4">
            <Link
              to="/theme-park"
              search={{ date: utcDateKey(ticket.visitDate) }}
              hash="whats-on"
            >
              <FerrisWheel className="size-4" />
              Browse what&apos;s on
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/my-bookings">View my bookings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/theme-park">Back to the theme park</Link>
        </Button>
      </div>
    </div>
  );
}
