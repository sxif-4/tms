import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BedDouble, CalendarDays, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
    <Card className="overflow-hidden p-0">
      <CardContent className="p-5">
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

function EmptyState() {
  return (
    <div className="glass-data rounded-xl border p-12 text-center">
      <p className="text-lg font-medium">No bookings here yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Start planning your island escape.
      </p>
      <Button asChild className="mt-4">
        <Link to="/hotels">Browse hotels</Link>
      </Button>
    </div>
  );
}

export function MyBookingsPage() {
  const queryClient = useQueryClient();
  const { data: bookings } = useSuspenseQuery(myHotelBookingsQueryOptions);
  const [cancelling, setCancelling] = useState<HotelBooking | null>(null);

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

  const upcoming = bookings.filter((b) => visitorTab(b.status) === "upcoming");
  const completed = bookings.filter((b) => visitorTab(b.status) === "completed");
  const cancelled = bookings.filter((b) => visitorTab(b.status) === "cancelled");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">My bookings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your upcoming trips and review past stays.
      </p>

      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            <Badge variant="secondary" className="ml-2">
              {upcoming.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">
              {completed.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled
            <Badge variant="secondary" className="ml-2">
              {cancelled.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={setCancelling}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-6 space-y-4">
          {completed.length === 0 ? (
            <EmptyState />
          ) : (
            completed.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-6 space-y-4">
          {cancelled.length === 0 ? (
            <EmptyState />
          ) : (
            cancelled.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>
      </Tabs>

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
