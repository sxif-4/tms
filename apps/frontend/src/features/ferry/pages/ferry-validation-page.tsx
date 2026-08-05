import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  SearchIcon,
  ShipWheelIcon,
  XCircleIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { PageHeading } from "~/components/page-heading";
import { cn } from "~/lib/utils";
import {
  FerryBookingStatusBadge,
  HotelStatusBadge,
} from "../components/ferry-badges";
import { FERRY_DIRECTION_LABELS, gbp } from "../constants";
import {
  lookupFerryBookingServerFn,
  validateFerryPassServerFn,
} from "../server";
import type { FerryBooking } from "../bookings-types";

/** How many boardings to keep on screen this session. */
const RECENT_LIMIT = 10;

type Result =
  | { kind: "boarded"; booking: FerryBooking }
  | { kind: "preview"; booking: FerryBooking }
  | { kind: "rejected"; reason: string };

type RecentBoarding = { booking: FerryBooking; at: Date };

const fmtTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const fmtDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

/**
 * The jetty screen. Deliberately spare: one big autofocused box, Enter to
 * board, and a result card readable across a busy pier. The rejection reason
 * comes from the API verbatim — "This pass is for 2026-08-09, not today" is
 * exactly what the operator needs to tell the guest.
 *
 * "Check details" is the non-mutating half: it answers the spec's *validate the
 * request* question (does this guest have a valid hotel booking?) without
 * marking anyone as boarded.
 */
export function FerryValidationPage() {
  const queryClient = useQueryClient();

  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [recent, setRecent] = useState<RecentBoarding[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const refocus = () => inputRef.current?.focus();

  const lookupMutation = useMutation({
    mutationFn: (bookingReference: string) =>
      lookupFerryBookingServerFn({ data: { bookingReference } }),
    onSuccess: (booking) => setResult({ kind: "preview", booking }),
    onError: (err) =>
      setResult({
        kind: "rejected",
        reason: err instanceof Error ? err.message : "Could not find that pass",
      }),
    onSettled: refocus,
  });

  const boardMutation = useMutation({
    mutationFn: (bookingReference: string) =>
      validateFerryPassServerFn({ data: { bookingReference } }),
    onSuccess: (booking) => {
      setResult({ kind: "boarded", booking });
      setRecent((prev) =>
        [{ booking, at: new Date() }, ...prev].slice(0, RECENT_LIMIT),
      );
      setReference("");
      queryClient.invalidateQueries({ queryKey: ["ferry", "bookings"] });
      queryClient.invalidateQueries({ queryKey: ["ferry", "dashboard"] });
    },
    onError: (err) =>
      setResult({
        kind: "rejected",
        reason:
          err instanceof Error ? err.message : "Could not board this passenger",
      }),
    onSettled: refocus,
  });

  const busy = lookupMutation.isPending || boardMutation.isPending;
  const trimmed = reference.trim();

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <Card>
        <CardHeader>
          <CardTitle>Board a passenger</CardTitle>
          <CardDescription>
            Scan or type the booking reference, then press Enter. Check details
            first if the guest is querying their eligibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              ref={inputRef}
              // The operator's hands are on the scanner, not the mouse.
              autoFocus
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmed) {
                  e.preventDefault();
                  boardMutation.mutate(trimmed);
                }
              }}
              placeholder="FB-XXXXXXXX"
              aria-label="Booking reference"
              className="h-14 font-mono text-lg tracking-wider"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() => lookupMutation.mutate(trimmed)}
                disabled={busy || !trimmed}
              >
                <SearchIcon data-icon="inline-start" />
                Check details
              </Button>
              <Button
                size="lg"
                className="h-14 px-8"
                onClick={() => boardMutation.mutate(trimmed)}
                disabled={busy || !trimmed}
              >
                {boardMutation.isPending ? "Boarding…" : "Board"}
              </Button>
            </div>
          </div>

          {result && <ResultCard result={result} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boarded this session</CardTitle>
          <CardDescription>
            The last {RECENT_LIMIT} passengers you let through.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nobody boarded yet. Scanned passes will appear here.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {recent.map(({ booking, at }) => (
                <li
                  key={`${booking.id}-${at.getTime()}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                    <span className="font-mono text-xs">
                      {booking.bookingReference}
                    </span>
                    <span className="text-sm">{booking.guestName}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    <span>
                      {booking.passengerCount} passenger
                      {booking.passengerCount === 1 ? "" : "s"}
                    </span>
                    <span className="tabular-nums">{fmtTime(at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Large, unmistakable outcome. Green and red are load-bearing here (this is a
 * glanceable operational signal, not decoration), so each is paired with an
 * icon and words — never colour alone.
 */
function ResultCard({ result }: { result: Result }) {
  if (result.kind === "rejected") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-destructive/50 bg-destructive/10 flex items-start gap-4 rounded-xl border-2 p-5"
      >
        <XCircleIcon className="text-destructive size-10 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-destructive text-xl font-semibold">Do not board</p>
          <p className="text-sm">{result.reason}</p>
        </div>
      </div>
    );
  }

  const { booking } = result;
  const boarded = result.kind === "boarded";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-4 rounded-xl border-2 p-5",
        boarded
          ? "border-emerald-600/50 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-border bg-muted/30",
      )}
    >
      <div className="flex items-start gap-4">
        {boarded ? (
          <CheckCircle2Icon className="size-10 shrink-0 text-emerald-600" />
        ) : (
          <ShipWheelIcon className="text-muted-foreground size-10 shrink-0" />
        )}
        <div className="flex flex-col gap-1">
          <p
            className={cn(
              "text-xl font-semibold",
              boarded && "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {boarded ? "Welcome aboard" : "Booking found"}
          </p>
          <p className="text-sm">
            <span className="font-medium">{booking.guestName}</span> ·{" "}
            {booking.passengerCount} passenger
            {booking.passengerCount === 1 ? "" : "s"} ·{" "}
            {gbp(Number(booking.totalAmount))}
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            {booking.bookingReference}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t pt-4 text-sm sm:grid-cols-2">
        <Detail
          label="Sailing"
          value={`${booking.routeName} · ${fmtDateTime(booking.departureAt)}`}
        />
        <Detail
          label="Direction"
          value={FERRY_DIRECTION_LABELS[booking.direction]}
        />
        <Detail
          label="Stay"
          value={`${booking.hotelName} · ${fmtDate(booking.hotelCheckIn)}–${fmtDate(booking.hotelCheckOut)}`}
        />
        <Detail label="Hotel booking" value={booking.hotelBookingReference} />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          Booking
        </span>
        <FerryBookingStatusBadge status={booking.status} />
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          Stay
        </span>
        <HotelStatusBadge status={booking.hotelStatus} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
