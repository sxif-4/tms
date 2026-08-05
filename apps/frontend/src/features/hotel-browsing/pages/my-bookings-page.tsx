import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowRight, BedDouble, CalendarDays, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useCurrentUser } from "~/features/auth/queries";
import { MyFerryBookingCard } from "~/features/ferry-browsing/components/my-ferry-booking-card";
import { myFerryBookingsQueryOptions } from "~/features/ferry-browsing/queries";
import { cancelMyFerryBookingServerFn } from "~/features/ferry-browsing/server";
import { NextUpCard } from "~/features/my-bookings/components/next-up-card";
import { TripRail } from "~/features/my-bookings/components/trip-rail";
import { TripRow } from "~/features/my-bookings/components/trip-row";
import {
  isUpcoming,
  nextUp,
  toTripItems,
  tripAlerts,
  tripPulse,
  type TripItem,
} from "~/features/my-bookings/trip-items";
import { MyEventBookingCard } from "~/features/park-browsing/components/my-event-booking-card";
import { MyParkTicketCard } from "~/features/park-browsing/components/my-park-ticket-card";
import {
  myEventBookingsQueryOptions,
  myParkTicketsQueryOptions,
} from "~/features/park-browsing/queries";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
  gbp,
} from "../constants";
import {
  cancelHotelBookingMutationOptions,
  myHotelBookingsQueryOptions,
} from "../queries";
import type { HotelBooking, HotelBookingStatus } from "../types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function visitorTab(
  status: HotelBookingStatus,
): "upcoming" | "completed" | "cancelled" {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  return "upcoming";
}

/** Matches backend: pending/confirmed and at least 48h before check-in. */
function canVisitorCancel(booking: HotelBooking): boolean {
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return false;
  }
  const hoursUntilCheckIn =
    (new Date(booking.checkIn).getTime() - Date.now()) / (60 * 60 * 1000);
  return hoursUntilCheckIn >= 48;
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: HotelBooking;
  onCancel?: (booking: HotelBooking) => void;
}) {
  const badgeVariant = BOOKING_STATUS_VARIANTS[booking.status];
  const showCancel = onCancel && canVisitorCancel(booking);

  return (
    <Card className="relative overflow-hidden p-0">
      {/* Domain spine, matching the merged timeline and the ferry/park cards. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-series-hotel"
      />
      <CardContent className="p-5 pl-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{booking.hotelName}</h3>
              <Badge variant={badgeVariant}>
                {BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <BedDouble className="size-3.5" />
              {booking.roomTypeName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {gbp(Number(booking.totalAmount))}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Check-in
            </p>
            <p className="mt-0.5 font-medium">{formatDate(booking.checkIn)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Check-out
            </p>
            <p className="mt-0.5 font-medium">{formatDate(booking.checkOut)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              Guests
            </p>
            <p className="mt-0.5 font-medium">{booking.guests}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <span className="font-mono text-xs text-muted-foreground">
            Ref: {booking.bookingReference}
          </span>
          <div className="flex items-center gap-2">
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCancel(booking)}
              >
                Cancel booking
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link
                to="/hotels/$hotelId"
                params={{ hotelId: String(booking.hotelId) }}
              >
                View hotel
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title = "No bookings here yet.",
  description = "Start planning your island escape.",
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; to: LinkProps["to"] };
}) {
  const cta = action ?? { label: "Browse hotels", to: "/hotels" };
  return (
    <div className="glass-data rounded-xl border p-12 text-center">
      <p className="text-lg font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-4">
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}

/** Tab label with its count, so the badge markup isn't repeated eight times. */
function CountTab({ value, label, count }: {
  value: string;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger value={value}>
      {label}
      <Badge variant="secondary" className="ml-2">
        {count}
      </Badge>
    </TabsTrigger>
  );
}

type HotelFilter = "upcoming" | "completed" | "cancelled";

export function MyBookingsPage() {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const { data: bookings } = useSuspenseQuery(myHotelBookingsQueryOptions);
  const { data: parkTickets } = useSuspenseQuery(myParkTicketsQueryOptions);
  const { data: eventBookings } = useSuspenseQuery(myEventBookingsQueryOptions);
  const { data: ferryBookings } = useSuspenseQuery(myFerryBookingsQueryOptions);
  const [cancelling, setCancelling] = useState<HotelBooking | null>(null);
  const [hotelFilter, setHotelFilter] = useState<HotelFilter>("upcoming");

  const cancelMutation = useMutation({
    ...cancelHotelBookingMutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: myHotelBookingsQueryOptions.queryKey,
      });
      toast.success("Booking cancelled");
      setCancelling(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to cancel"),
  });

  const cancelFerryMutation = useMutation({
    mutationFn: (id: number) => cancelMyFerryBookingServerFn({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: myFerryBookingsQueryOptions.queryKey,
      });
      toast.success("Ferry booking cancelled");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to cancel"),
  });

  const hotelCounts: Record<HotelFilter, number> = {
    upcoming: bookings.filter((b) => visitorTab(b.status) === "upcoming").length,
    completed: bookings.filter((b) => visitorTab(b.status) === "completed")
      .length,
    cancelled: bookings.filter((b) => visitorTab(b.status) === "cancelled")
      .length,
  };
  const filteredHotels = bookings.filter(
    (b) => visitorTab(b.status) === hotelFilter,
  );

  /** Newest visit first, so an upcoming day sits above last month's. */
  const tickets = [...parkTickets].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
  );
  const activities = [...eventBookings].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  );
  const ferry = [...ferryBookings].sort(
    (a, b) =>
      new Date(b.departureAt).getTime() - new Date(a.departureAt).getTime(),
  );

  const sources = useMemo(
    () => ({
      hotels: bookings,
      ferry: ferryBookings,
      tickets: parkTickets,
      events: eventBookings,
    }),
    [bookings, ferryBookings, parkTickets, eventBookings],
  );

  /*
   * Time-dependent derivations are pinned to one timestamp per render. Reading
   * Date.now() separately in each helper lets "upcoming" and "next up" disagree
   * for a booking sitting exactly on the boundary.
   */
  const { items, upcomingItems, pastItems, pulse, alerts, next } =
    useMemo(() => {
      const now = Date.now();
      const all = toTripItems(sources);
      const upcoming = all.filter((i) => isUpcoming(i, now));
      return {
        items: all,
        upcomingItems: upcoming,
        // Newest first: a trip that just ended is more interesting than one
        // from a year ago.
        pastItems: all.filter((i) => !isUpcoming(i, now)).reverse(),
        pulse: tripPulse(all, now),
        alerts: tripAlerts(sources, now),
        next: nextUp(all, now),
      };
    }, [sources]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          My bookings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your upcoming trips, park tickets and activities.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/*
          On a narrow screen the rail's alerts and next-departure matter more
          than the full history, so it sits above the tabs; from `lg` up it
          becomes the right-hand column.
        */}
        <div className="order-2 min-w-0 lg:order-1">
          {next && (
            <div className="mb-8">
              <NextUpCard item={next} />
            </div>
          )}

          <Tabs defaultValue="all">
            {/* One tab row. The hotel status filter is a select, not a second
                row of tabs — nesting tabs gave the page two levels of state
                and two sets of counts that contradicted each other. */}
            <TabsList className="flex-wrap">
              <CountTab value="all" label="All" count={items.length} />
              <CountTab
                value="hotels"
                label="Hotels"
                count={bookings.length}
              />
              <CountTab value="ferry" label="Ferry" count={ferry.length} />
              <CountTab
                value="park-tickets"
                label="Park"
                count={tickets.length}
              />
              <CountTab
                value="activities"
                label="Activities"
                count={activities.length}
              />
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {items.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-6">
                  {upcomingItems.length > 0 && (
                    <TimelineGroup
                      title="Upcoming"
                      items={upcomingItems}
                      count={upcomingItems.length}
                    />
                  )}
                  {pastItems.length > 0 && (
                    <TimelineGroup
                      title="Past and cancelled"
                      items={pastItems}
                      count={pastItems.length}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hotels" className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {filteredHotels.length} booking
                  {filteredHotels.length === 1 ? "" : "s"}
                </p>
                <Select
                  value={hotelFilter}
                  onValueChange={(v) => setHotelFilter(v as HotelFilter)}
                >
                  <SelectTrigger className="w-44" aria-label="Filter stays">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">
                      Upcoming ({hotelCounts.upcoming})
                    </SelectItem>
                    <SelectItem value="completed">
                      Completed ({hotelCounts.completed})
                    </SelectItem>
                    <SelectItem value="cancelled">
                      Cancelled ({hotelCounts.cancelled})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                {filteredHotels.length === 0 ? (
                  <EmptyState
                    title={`No ${hotelFilter} stays.`}
                    description="Start planning your island escape."
                  />
                ) : (
                  filteredHotels.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onCancel={
                        hotelFilter === "upcoming" ? setCancelling : undefined
                      }
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="ferry" className="mt-6 space-y-4">
              {/*
                Ferry passes arrive automatically with a hotel booking, so most
                guests reach this tab without ever seeing the booking form. The
                way to travel at another time has to be offered here.
              */}
              {ferry.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">
                    Your return ferry is included with your stay. Want to travel
                    at a different time?
                  </p>
                  <Button asChild size="sm">
                    <Link to="/ferry/book">Book another sailing</Link>
                  </Button>
                </div>
              )}
              {ferry.length === 0 ? (
                <EmptyState
                  title="No ferry trips booked."
                  description="Ferry seats are reserved against a confirmed hotel stay covering the sailing date."
                  action={{ label: "See sailings", to: "/ferry" }}
                />
              ) : (
                ferry.map((b) => (
                  <MyFerryBookingCard
                    key={b.id}
                    booking={b}
                    cancelling={cancelFerryMutation.isPending}
                    onCancel={() => cancelFerryMutation.mutate(b.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="park-tickets" className="mt-6 space-y-4">
              {tickets.length === 0 ? (
                <EmptyState
                  title="No park tickets yet."
                  description="A park ticket admits you for one day — and it's what rides and shows are booked against."
                  action={{
                    label: "Buy park tickets",
                    to: "/theme-park/tickets",
                  }}
                />
              ) : (
                tickets.map((t) => <MyParkTicketCard key={t.id} ticket={t} />)
              )}
            </TabsContent>

            <TabsContent value="activities" className="mt-6 space-y-4">
              {activities.length === 0 ? (
                <EmptyState
                  title="No activities booked."
                  description="Rides, shows and beach events are booked against a park ticket for the same day."
                  action={{ label: "See what's on", to: "/theme-park" }}
                />
              ) : (
                activities.map((b) => (
                  <MyEventBookingCard key={b.id} booking={b} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="order-1 lg:order-2">
          <TripRail
            name={user?.name ?? "Guest"}
            email={user?.email ?? ""}
            memberSince={memberSince}
            pulse={pulse}
            alerts={alerts}
          />
        </div>
      </div>

      <ConfirmDialog
        open={cancelling != null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null);
        }}
        title="Cancel this booking?"
        description="Free cancellation is available up to 48 hours before check-in. This cannot be undone."
        confirmLabel="Cancel booking"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => {
          if (cancelling) cancelMutation.mutate(cancelling.id);
        }}
      />
    </div>
  );
}

function TimelineGroup({
  title,
  items,
  count,
}: {
  title: string;
  items: TripItem[];
  count: number;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <TripRow key={item.key} item={item} />
        ))}
      </ul>
    </section>
  );
}
