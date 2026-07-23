import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarCheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { EmptyState } from "~/features/hotels/components/empty-state";
import { EventBookingStatusBadge } from "../components/park-badges";
import {
  EVENT_BOOKING_STATUSES,
  EVENT_BOOKING_STATUS_LABELS,
  gbp,
} from "../constants";
import { eventBookingsQueryOptions, parkEventsQueryOptions } from "../queries";
import { updateEventBookingStatusServerFn } from "../server";
import type { EventBooking, EventBookingStatus } from "../types";

const ALL = "all";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ParkBookingsPage() {
  const queryClient = useQueryClient();
  const { data: events } = useSuspenseQuery(parkEventsQueryOptions());

  const [eventId, setEventId] = useState<number | typeof ALL>(ALL);
  const [status, setStatus] = useState<EventBookingStatus | typeof ALL>(ALL);

  const { data: bookings } = useSuspenseQuery(
    eventBookingsQueryOptions({
      eventId: eventId === ALL ? undefined : eventId,
      status: status === ALL ? undefined : status,
    }),
  );

  const [confirming, setConfirming] = useState<EventBooking | null>(null);
  const [cancelling, setCancelling] = useState<EventBooking | null>(null);

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: "confirmed" | "cancelled" }) =>
      updateEventBookingStatusServerFn({ data: input }),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["event-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["event-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["park-dashboard"] });
      toast.success(
        input.status === "cancelled" ? "Booking cancelled" : "Booking confirmed",
      );
      setConfirming(null);
      setCancelling(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to update booking",
      ),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Event bookings</h1>
        <p className="text-sm text-muted-foreground">
          Seats visitors have booked on rides, shows and beach events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>
            Cancelling a booking releases its seats and refunds the payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="b-event" className="text-xs font-medium">
                Event
              </label>
              <Select
                value={eventId === ALL ? ALL : String(eventId)}
                onValueChange={(v) => setEventId(v === ALL ? ALL : Number(v))}
              >
                <SelectTrigger id="b-event" className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All events</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="b-status" className="text-xs font-medium">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as EventBookingStatus | typeof ALL)
                }
              >
                <SelectTrigger id="b-status" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {EVENT_BOOKING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {EVENT_BOOKING_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(eventId !== ALL || status !== ALL) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEventId(ALL);
                  setStatus(ALL);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheckIcon}
              title="No bookings match"
              description="No event bookings match these filters. Visitors book seats from the event pages."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead className="text-right">Seats</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Park ticket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">
                      {b.bookingReference}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{b.visitorName}</span>
                        <span className="text-muted-foreground text-xs">
                          {b.visitorEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{b.eventName}</TableCell>
                    <TableCell>{fmtDateTime(b.startAt)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {b.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {gbp(Number(b.totalAmount))}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {b.ticketReference}
                    </TableCell>
                    <TableCell>
                      <EventBookingStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {/* Cancelling is terminal — the API refuses to revive a
                          cancelled booking, so those rows get no actions. */}
                      {b.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirming(b)}
                        >
                          Confirm
                        </Button>
                      )}
                      {b.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelling(b)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirming != null}
        onOpenChange={(o) => !o && setConfirming(null)}
        title="Confirm this booking?"
        description={`${confirming?.bookingReference} for ${confirming?.visitorName} will be confirmed.`}
        confirmLabel="Confirm booking"
        pending={statusMutation.isPending}
        onConfirm={() =>
          confirming &&
          statusMutation.mutate({ id: confirming.id, status: "confirmed" })
        }
      />
      <ConfirmDialog
        open={cancelling != null}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this booking?"
        description={`${cancelling?.bookingReference} will be cancelled, its ${cancelling?.quantity ?? ""} seat(s) released, and the payment refunded. This can't be undone — the visitor would need to book again.`}
        confirmLabel="Cancel booking"
        destructive
        pending={statusMutation.isPending}
        onConfirm={() =>
          cancelling &&
          statusMutation.mutate({ id: cancelling.id, status: "cancelled" })
        }
      />
    </div>
  );
}
