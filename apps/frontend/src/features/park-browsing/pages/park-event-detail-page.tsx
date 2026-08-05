import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Minus, Plus, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { meQueryOptions } from "~/features/auth/queries";
import { InlineAuthPanel } from "~/features/hotel-browsing/components/inline-auth-panel";
import { cn } from "~/lib/utils";
import { EventSchedulePicker } from "../components/event-schedule-picker";
import {
  TicketPrerequisiteNotice,
  ticketPrerequisiteState,
} from "../components/ticket-prerequisite-notice";
import {
  EVENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  gbp,
  utcDateKey,
} from "../constants";
import {
  createEventBookingMutationOptions,
  myEventBookingsQueryOptions,
  myParkTicketsQueryOptions,
  publicParkEventQueryOptions,
} from "../queries";
import type { PublicSchedule } from "../types";

export function ParkEventDetailPage({
  eventId,
  plannedDate,
}: {
  eventId: number;
  plannedDate?: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: event } = useSuspenseQuery(
    publicParkEventQueryOptions(eventId),
  );
  const { data: user } = useQuery(meQueryOptions);

  // `/park-tickets/mine` is authenticated — asking for it while signed out
  // would just 401 and surface as a page error.
  const { data: tickets = [], isPending: ticketsPending } = useQuery({
    ...myParkTicketsQueryOptions,
    enabled: Boolean(user),
  });

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    () => {
      const bookable = event.schedules.filter((s) => s.remaining > 0);
      const onPlannedDay = plannedDate
        ? bookable.find((s) => utcDateKey(s.startAt) === plannedDate)
        : undefined;
      return (onPlannedDay ?? bookable[0])?.id ?? null;
    },
  );
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAuth, setShowAuth] = useState(false);

  const schedule: PublicSchedule | null =
    event.schedules.find((s) => s.id === selectedScheduleId) ?? null;

  const state = useMemo(
    () =>
      ticketPrerequisiteState({
        schedule,
        tickets,
        isSignedIn: Boolean(user),
        ticketsLoading: Boolean(user) && ticketsPending,
      }),
    [schedule, tickets, user, ticketsPending],
  );

  const eligible = state.kind === "ready" ? state.eligible : [];
  // Default to the first eligible ticket, but respect an explicit choice.
  const activeTicket =
    eligible.find((t) => t.id === ticketId) ?? eligible[0] ?? null;

  /** Both caps are enforced server-side; mirroring them keeps the UI honest. */
  const maxQuantity = Math.max(
    1,
    Math.min(activeTicket?.quantity ?? 1, schedule?.remaining ?? 1),
  );
  const effectiveQuantity = Math.min(quantity, maxQuantity);

  const price = Number(event.basePrice);
  const total = price * effectiveQuantity;

  const book = useMutation({
    ...createEventBookingMutationOptions(),
    onSuccess: (booking) => {
      toast.success("Seats booked!");
      void queryClient.invalidateQueries({
        queryKey: publicParkEventQueryOptions(eventId).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: myEventBookingsQueryOptions.queryKey,
      });
      void navigate({
        to: "/theme-park/confirmation",
        search: { ref: booking.bookingReference },
      });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Booking failed"),
  });

  const submit = () => {
    if (!schedule || !activeTicket) return;
    book.mutate({
      eventScheduleId: schedule.id,
      parkTicketId: activeTicket.id,
      quantity: effectiveQuantity,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/theme-park/events">
          <ArrowLeft className="size-4" />
          All experiences
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {event.name}
            </h1>
            <Badge variant="secondary">
              {EVENT_TYPE_LABELS[event.eventType]}
            </Badge>
            <Badge variant="outline">
              {LOCATION_TYPE_LABELS[event.locationType]}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {event.description}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{gbp(price)}</p>
          <p className="text-xs text-muted-foreground">per seat</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="glass-data rounded-xl border p-5">
          <h2 className="font-semibold">Choose a time</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Only upcoming times are listed.
          </p>
          {event.schedules.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">Nothing scheduled right now</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon — new times are added regularly.
              </p>
            </div>
          ) : (
            <EventSchedulePicker
              schedules={event.schedules}
              selectedId={selectedScheduleId}
              onSelect={(s) => {
                setSelectedScheduleId(s.id);
                setTicketId(null);
              }}
              highlightDate={plannedDate}
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="glass-data-strong overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <h2 className="font-semibold">Book seats</h2>

              <TicketPrerequisiteNotice
                state={state}
                onSignIn={() => setShowAuth(true)}
              />

              {state.kind === "ready" && activeTicket && (
                <>
                  {eligible.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Use which ticket?</p>
                      {eligible.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTicketId(t.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                            activeTicket.id === t.id &&
                              "border-series-park ring-1 ring-series-park/40",
                          )}
                        >
                          <Ticket className="size-4 shrink-0 text-series-park" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-mono text-xs">
                              {t.ticketReference}
                            </span>
                            <span className="block text-muted-foreground">
                              {t.ticketTypeName} · covers {t.quantity}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {eligible.length === 1 && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="size-4 text-series-park" />
                      Using ticket{" "}
                      <span className="font-mono">
                        {activeTicket.ticketReference}
                      </span>
                    </p>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Seats</p>
                      <p className="text-xs text-muted-foreground">
                        Up to {maxQuantity}
                        {activeTicket.quantity <= (schedule?.remaining ?? 0)
                          ? " (your ticket covers " +
                            activeTicket.quantity +
                            ")"
                          : " left on this time"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="One fewer seat"
                        onClick={() =>
                          setQuantity((q) =>
                            Math.max(1, Math.min(q, maxQuantity) - 1),
                          )
                        }
                        disabled={effectiveQuantity <= 1}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span
                        aria-live="polite"
                        className="w-8 text-center text-lg font-semibold tabular-nums"
                      >
                        {effectiveQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="One more seat"
                        onClick={() =>
                          setQuantity((q) => Math.min(maxQuantity, q + 1))
                        }
                        disabled={effectiveQuantity >= maxQuantity}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {gbp(price)} × {effectiveQuantity}
                    </span>
                    <span className="text-xl font-semibold">{gbp(total)}</span>
                  </div>

                  <Button
                    className="w-full"
                    onClick={submit}
                    disabled={book.isPending}
                  >
                    {book.isPending ? "Booking…" : "Book seats"}
                    {!book.isPending && <Check className="size-4" />}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {showAuth && !user && (
            <div className="mt-4">
              <InlineAuthPanel onSuccess={() => setShowAuth(false)} />
            </div>
          )}
        </aside>
      </div>

      {/* On a phone the booking box sits below a long list of times, so the
          action follows the reader down. Only once booking is actually
          possible — a bar offering "Book seats" to someone without a ticket
          would be a dead end. */}
      {state.kind === "ready" && activeTicket && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tabular-nums">
                {gbp(total)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {effectiveQuantity} seat{effectiveQuantity === 1 ? "" : "s"} ·{" "}
                {event.name}
              </p>
            </div>
            <Button size="sm" onClick={submit} disabled={book.isPending}>
              {book.isPending ? "Booking…" : "Book seats"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
