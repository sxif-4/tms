import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  CalendarCheckIcon,
  FerrisWheelIcon,
  HotelIcon,
  ShipIcon,
  TicketIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageHeading } from "~/components/page-heading";
import { StatCard } from "~/features/reports/components/stat-card";
import { BookingSection, type BookingRow } from "../components/booking-section";
import { PaymentsCard } from "../components/payments-card";
import { CANCEL_WARNINGS, DOMAIN_LABELS, gbpExact } from "../constants";
import { customerQueryOptions } from "../queries";
import { cancelCustomerBookingServerFn } from "../server";
import type { BookingDomain } from "../types";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function CustomerDetailPage({ customerId }: { customerId: number }) {
  const queryClient = useQueryClient();
  const { data: profile } = useSuspenseQuery(customerQueryOptions(customerId));
  const [pending, setPending] = useState<{
    domain: BookingDomain;
    row: BookingRow;
  } | null>(null);

  const cancelMutation = useMutation({
    mutationFn: ({ domain, row }: { domain: BookingDomain; row: BookingRow }) =>
      cancelCustomerBookingServerFn({ data: { domain, id: row.id } }),
    onSuccess: () => {
      // The cascade can touch other domains, so refetch the whole profile.
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Booking cancelled");
      setPending(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to cancel"),
  });

  const { customer, totals } = profile;

  const hotelRows: BookingRow[] = profile.hotelBookings.map((b) => ({
    id: b.id,
    reference: b.bookingReference,
    title: b.hotelName,
    subtitle: `${b.roomTypeName} · ${shortDate(b.checkIn)} → ${shortDate(b.checkOut)} · ${b.guests} ${b.guests === 1 ? "guest" : "guests"}`,
    amount: b.totalAmount,
    status: b.status,
  }));

  const ferryRows: BookingRow[] = profile.ferryBookings.map((b) => ({
    id: b.id,
    reference: b.bookingReference,
    title: `${b.origin} → ${b.destination}`,
    subtitle: `${dateTime(b.departureAt)} · ${b.passengerCount} ${b.passengerCount === 1 ? "passenger" : "passengers"}${Number(b.totalAmount) === 0 ? " · complimentary" : ""}`,
    amount: b.totalAmount,
    status: b.status,
  }));

  const parkRows: BookingRow[] = profile.parkTickets.map((t) => ({
    id: t.id,
    reference: t.ticketReference,
    title: t.ticketTypeName,
    subtitle: `Visit ${shortDate(t.visitDate)} · ${t.quantity} ${t.quantity === 1 ? "ticket" : "tickets"}`,
    amount: t.totalAmount,
    status: t.status,
  }));

  const eventRows: BookingRow[] = profile.eventBookings.map((b) => ({
    id: b.id,
    reference: b.bookingReference,
    title: b.eventName,
    subtitle: `${dateTime(b.startAt)} · ${b.quantity} ${b.quantity === 1 ? "place" : "places"} · on ${b.ticketReference}`,
    amount: b.totalAmount,
    status: b.status,
  }));

  const hasBookings =
    hotelRows.length + ferryRows.length + parkRows.length + eventRows.length >
    0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/dashboard/admin/customers"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          All customers
        </Link>
        <PageHeading />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {customer.name}
            {!customer.isActive && <Badge variant="secondary">Inactive</Badge>}
          </CardTitle>
          <CardDescription>
            {customer.email}
            {customer.phone ? ` · ${customer.phone}` : ""} · Customer since{" "}
            {shortDate(customer.createdAt)}
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Lifetime value"
          value={gbpExact(totals.lifetimeValue)}
          hint="Completed payments"
          icon={CalendarCheckIcon}
        />
        <StatCard
          label="Refunded"
          value={gbpExact(totals.refunded)}
          icon={TicketIcon}
        />
        <StatCard
          label="Live bookings"
          value={totals.liveBookings}
          icon={HotelIcon}
        />
      </section>

      {!hasBookings && (
        <p className="text-sm text-muted-foreground">
          This customer has no bookings yet.
        </p>
      )}

      <BookingSection
        label={DOMAIN_LABELS.hotel}
        description="Rooms booked across every hotel."
        icon={HotelIcon}
        domain="hotel"
        rows={hotelRows}
        onCancel={(domain, row) => setPending({ domain, row })}
      />
      <BookingSection
        label={DOMAIN_LABELS.ferry}
        description="Sailings booked or issued with a stay."
        icon={ShipIcon}
        domain="ferry"
        rows={ferryRows}
        onCancel={(domain, row) => setPending({ domain, row })}
      />
      <BookingSection
        label={DOMAIN_LABELS.park}
        description="Theme park admission by visit date."
        icon={TicketIcon}
        domain="park"
        rows={parkRows}
        onCancel={(domain, row) => setPending({ domain, row })}
      />
      <BookingSection
        label={DOMAIN_LABELS.event}
        description="Rides, shows and beach events."
        icon={FerrisWheelIcon}
        domain="event"
        rows={eventRows}
        onCancel={(domain, row) => setPending({ domain, row })}
      />

      <PaymentsCard payments={profile.payments} />

      <ConfirmDialog
        open={pending != null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Cancel this booking?"
        description={
          pending
            ? `${pending.row.title} (${pending.row.reference}). ${CANCEL_WARNINGS[pending.domain]}`
            : ""
        }
        confirmLabel="Cancel booking"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => pending && cancelMutation.mutate(pending)}
      />
    </div>
  );
}
