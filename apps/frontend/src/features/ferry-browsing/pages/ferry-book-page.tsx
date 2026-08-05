import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircleIcon, BedDouble, Ship, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { gbp } from "~/features/ferry/constants";
import {
  bookableSailingsQueryOptions,
  myEligibleStaysQueryOptions,
} from "../queries";
import { bookFerryServerFn } from "../server";
import type { BookableSailing, EligibleStay } from "../types";

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

/** Same ±1 day grace the API applies, so the form never offers a doomed sailing. */
const GRACE_DAYS = 1;
const dayKey = (value: string | Date) =>
  new Date(value).toISOString().slice(0, 10);
const shiftDays = (value: string, days: number) => {
  const d = new Date(value);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * The visitor reservation form. The stay comes first because it is the thing
 * that authorises travel at all — picking it narrows the sailings to the ones
 * the API would actually accept, so the rule is taught by the UI rather than
 * only enforced by an error.
 */
export function FerryBookPage() {
  const navigate = useNavigate();

  const [stayId, setStayId] = useState<number | null>(null);
  const [sailingId, setSailingId] = useState<number | null>(null);
  const [passengers, setPassengers] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);

  const stays = useQuery(myEligibleStaysQueryOptions);
  const sailings = useQuery(bookableSailingsQueryOptions());

  const selectedStay = useMemo(
    () => (stays.data ?? []).find((stay) => stay.id === stayId) ?? null,
    [stays.data, stayId],
  );

  /** Sailings inside the chosen stay's travel window. */
  const availableSailings = useMemo(() => {
    if (!selectedStay) return [];
    const from = shiftDays(selectedStay.checkIn, -GRACE_DAYS);
    const to = shiftDays(selectedStay.checkOut, GRACE_DAYS);
    return (sailings.data ?? []).filter((sailing) => {
      const key = dayKey(sailing.departureAt);
      return key >= from && key <= to;
    });
  }, [sailings.data, selectedStay]);

  const selectedSailing = useMemo(
    () => availableSailings.find((s) => s.id === sailingId) ?? null,
    [availableSailings, sailingId],
  );

  const count = Number(passengers);
  const total =
    selectedSailing && count > 0
      ? Number(selectedSailing.basePrice) * count
      : 0;

  const overCapacity =
    selectedSailing != null && count > selectedSailing.remainingSeats;

  const mutation = useMutation({
    mutationFn: () =>
      bookFerryServerFn({
        data: {
          scheduleId: sailingId!,
          hotelBookingId: stayId!,
          passengerCount: count,
        },
      }),
    onSuccess: (booking) => {
      navigate({
        to: "/ferry/confirmation",
        search: { reference: booking.bookingReference },
      });
    },
    onError: (err) =>
      setFormError(
        err instanceof Error ? err.message : "Failed to reserve your seat",
      ),
  });

  const canSubmit =
    stayId != null && sailingId != null && count > 0 && !overCapacity;

  if (stays.isLoading) {
    return <Shell>Loading your stays…</Shell>;
  }

  if (stays.isError) {
    return (
      <Shell>
        {stays.error instanceof Error
          ? stays.error.message
          : "Could not load your stays."}
      </Shell>
    );
  }

  if ((stays.data ?? []).length === 0) {
    return <NoEligibleStay />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Book an extra sailing
        </h1>
        <p className="text-muted-foreground mt-2">
          Your stay already includes a return ferry. Use this to travel at a
          different time — booking a seat replaces the included pass for that
          leg of the journey.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Your stay</CardTitle>
            <CardDescription>
              Only confirmed stays can authorise ferry travel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stays.data ?? []).map((stay) => (
              <StayOption
                key={stay.id}
                stay={stay}
                selected={stayId === stay.id}
                onSelect={() => {
                  setStayId(stay.id);
                  setSailingId(null);
                  setFormError(null);
                }}
              />
            ))}
          </CardContent>
        </Card>

        <Card className={cn(!selectedStay && "opacity-60")}>
          <CardHeader>
            <CardTitle className="text-lg">2. Your sailing</CardTitle>
            <CardDescription>
              {selectedStay
                ? `Sailings between ${fmtDate(shiftDays(selectedStay.checkIn, -GRACE_DAYS))} and ${fmtDate(shiftDays(selectedStay.checkOut, GRACE_DAYS))}.`
                : "Choose a stay first."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedStay ? null : sailings.isLoading ? (
              <Note>Loading sailings…</Note>
            ) : availableSailings.length === 0 ? (
              <Note>
                No sailings are available within this stay. Try another stay, or
                check back once more departures are scheduled.
              </Note>
            ) : (
              availableSailings.map((sailing) => (
                <SailingOption
                  key={sailing.id}
                  sailing={sailing}
                  selected={sailingId === sailing.id}
                  onSelect={() => {
                    setSailingId(sailing.id);
                    setFormError(null);
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className={cn(!selectedSailing && "opacity-60")}>
          <CardHeader>
            <CardTitle className="text-lg">3. Passengers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid max-w-xs gap-2">
              <Label htmlFor="passengers">How many travelling?</Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max={selectedSailing?.remainingSeats ?? 255}
                value={passengers}
                disabled={!selectedSailing}
                onChange={(event) => setPassengers(event.target.value)}
              />
              {overCapacity && selectedSailing ? (
                <p className="text-destructive text-sm">
                  Only {selectedSailing.remainingSeats} seat
                  {selectedSailing.remainingSeats === 1 ? "" : "s"} left on this
                  sailing.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div>
                <p className="text-muted-foreground text-sm">Total</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {gbp(total)}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !canSubmit}
              >
                {mutation.isPending ? "Reserving…" : "Reserve seat"}
              </Button>
            </div>

            {formError ? (
              <p className="text-destructive flex items-start gap-2 text-sm">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                {formError}
              </p>
            ) : null}

            <p className="text-muted-foreground text-xs">
              Our team checks your stay and issues the pass — you will find it
              under My bookings. The included pass for this direction is
              replaced once you book.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StayOption({
  stay,
  selected,
  onSelect,
}: {
  stay: EligibleStay;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-series-ferry bg-series-ferry/10"
          : "border-border/60 hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2">
        <BedDouble className="text-series-ferry size-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{stay.hotelName}</p>
          <p className="text-muted-foreground text-xs">
            {fmtDate(stay.checkIn)} – {fmtDate(stay.checkOut)} ·{" "}
            {stay.bookingReference}
          </p>
        </div>
      </div>
      <Badge variant="secondary">
        {stay.status === "completed" ? "Completed" : "Confirmed"}
      </Badge>
    </button>
  );
}

function SailingOption({
  sailing,
  selected,
  onSelect,
}: {
  sailing: BookableSailing;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-series-ferry bg-series-ferry/10"
          : "border-border/60 hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2">
        <Ship className="text-series-ferry size-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">
            {sailing.origin} → {sailing.destination}
          </p>
          <p className="text-muted-foreground text-xs">
            {fmtDateTime(sailing.departureAt)}
          </p>
        </div>
      </div>
      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" />
          {sailing.remainingSeats} left
        </span>
        <span className="text-foreground font-medium tabular-nums">
          {gbp(Number(sailing.basePrice))}
        </span>
      </div>
    </button>
  );
}

/** A visitor with no confirmed stay cannot travel — send them to fix that. */
function NoEligibleStay() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <span className="bg-series-ferry/15 mx-auto flex size-16 items-center justify-center rounded-full">
        <BedDouble className="text-series-ferry size-8" />
      </span>
      <h1 className="mt-6 text-2xl font-bold">A hotel stay comes first</h1>
      <p className="text-muted-foreground mt-3">
        Ferry seats are reserved for guests staying on the island. Once you have
        a confirmed hotel booking, you can reserve a sailing within your dates.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/hotels">Browse hotel stays</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/my-bookings">My bookings</Link>
        </Button>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/60 text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
      {children}
    </div>
  );
}
