import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, CheckCircle2Icon, TicketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { gbp, toDateKey } from "../constants";
import { eventSchedulesQueryOptions } from "../queries";
import { lookupParkTicketServerFn, staffEventBookingServerFn } from "../server";
import type { ParkEvent, ParkTicket } from "../types";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Seats a walk-up guest onto an event using the park ticket they're holding.
 *
 * The order of the form mirrors the rules the API enforces: look the ticket up
 * first, then only offer times on that ticket's visit day, then cap the seats
 * at what the ticket covers. Every constraint is visible before submit rather
 * than arriving as a 400.
 */
export function ManualBookingDialog({
  open,
  onOpenChange,
  events,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: ParkEvent[];
}) {
  const queryClient = useQueryClient();

  const [reference, setReference] = useState("");
  const [ticket, setTicket] = useState<ParkTicket | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) return;
    setReference("");
    setTicket(null);
    setLookupError(null);
    setScheduleId(null);
    setQuantity(1);
  }, [open]);

  const lookup = useMutation({
    mutationFn: (reference: string) =>
      lookupParkTicketServerFn({ data: { reference } }),
    onSuccess: (found) => {
      setTicket(found);
      setLookupError(null);
      setScheduleId(null);
    },
    onError: (err) => {
      setTicket(null);
      setLookupError(
        err instanceof Error ? err.message : "No ticket with that reference",
      );
    },
  });

  /**
   * Schedules for the ticket's visit day only — the API rejects a booking
   * whose schedule falls on any other day. The range spans the whole day:
   * `to` is an inclusive `startAt <= to`, so a bare date would filter out
   * every afternoon and evening slot.
   */
  const visitDay = ticket ? toDateKey(new Date(ticket.visitDate)) : undefined;
  const { data: schedules = [], isFetching: schedulesLoading } = useQuery({
    ...eventSchedulesQueryOptions({
      from: visitDay ? `${visitDay}T00:00:00.000Z` : undefined,
      to: visitDay ? `${visitDay}T23:59:59.999Z` : undefined,
    }),
    enabled: Boolean(visitDay),
  });

  const bookable = schedules.filter((s) => s.remaining > 0);
  const schedule = bookable.find((s) => s.id === scheduleId) ?? null;

  const eventPrice = (eventId: number) =>
    Number(events.find((e) => e.id === eventId)?.basePrice ?? 0);

  const ticketUsable = ticket?.status === "active";
  const maxSeats = Math.min(ticket?.quantity ?? 1, schedule?.remaining ?? 1);
  const seats = Math.min(Math.max(1, quantity), Math.max(1, maxSeats));
  const total = schedule ? eventPrice(schedule.eventId) * seats : 0;

  const book = useMutation({
    mutationFn: () =>
      staffEventBookingServerFn({
        data: {
          ticketReference: ticket!.ticketReference,
          eventScheduleId: schedule!.id,
          quantity: seats,
        },
      }),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ["event-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["event-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["park-dashboard"] });
      toast.success(`Booked ${booking.bookingReference}`);
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to book seats"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book seats for a guest</DialogTitle>
          <DialogDescription>
            Uses the park ticket the guest is holding. The booking goes to them,
            not to you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="mb-ref">Park ticket reference</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="mb-ref"
                placeholder="PT-XXXXXXXX"
                autoComplete="off"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reference.trim()) {
                    e.preventDefault();
                    lookup.mutate(reference.trim());
                  }
                }}
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => lookup.mutate(reference.trim())}
                disabled={!reference.trim() || lookup.isPending}
              >
                {lookup.isPending ? "Finding…" : "Find"}
              </Button>
            </div>
            {lookupError && (
              <p className="text-destructive flex items-center gap-1.5 text-sm">
                <AlertCircleIcon className="size-4" />
                {lookupError}
              </p>
            )}
          </Field>

          {ticket && (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <TicketIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{ticket.buyerName}</p>
                  <p className="text-muted-foreground">
                    {ticket.ticketTypeName} · covers {ticket.quantity} ·{" "}
                    {new Date(ticket.visitDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {ticketUsable ? (
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircleIcon className="text-destructive size-4 shrink-0" />
                )}
              </div>
              {!ticketUsable && (
                <p className="text-destructive text-sm">
                  This ticket is {ticket.status} — it can&apos;t be used to book
                  seats.
                </p>
              )}
            </div>
          )}

          {ticket && ticketUsable && (
            <>
              <Field>
                <FieldLabel htmlFor="mb-schedule">Event time</FieldLabel>
                <Select
                  value={scheduleId ? String(scheduleId) : undefined}
                  onValueChange={(v) => setScheduleId(Number(v))}
                  disabled={bookable.length === 0}
                >
                  <SelectTrigger id="mb-schedule">
                    <SelectValue
                      placeholder={
                        schedulesLoading
                          ? "Loading times…"
                          : bookable.length === 0
                            ? "Nothing running that day"
                            : "Pick a time"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {bookable.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.eventName} · {fmtDateTime(s.startAt)} · {s.remaining}{" "}
                        left
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Only times on the ticket&apos;s visit day are listed.
                </p>
              </Field>

              {schedule && (
                <>
                  <Field>
                    <FieldLabel htmlFor="mb-seats">Seats</FieldLabel>
                    <Input
                      id="mb-seats"
                      type="number"
                      min={1}
                      max={maxSeats}
                      value={seats}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                    <p className="text-muted-foreground text-xs">
                      Up to {maxSeats} — the ticket covers {ticket.quantity} and{" "}
                      {schedule.remaining} seat(s) are left.
                    </p>
                  </Field>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium">
                      Total to collect
                    </span>
                    <span className="text-xl font-semibold tabular-nums">
                      {gbp(total)}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={book.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => book.mutate()}
            disabled={!ticket || !ticketUsable || !schedule || book.isPending}
          >
            {book.isPending ? "Booking…" : "Book seats"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
