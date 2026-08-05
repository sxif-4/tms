import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Anchor, BedDouble, Clock, Ship, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { gbp } from "~/features/ferry/constants";
import { bookableSailingsQueryOptions } from "../queries";
import type { BookableSailing } from "../types";

const DIRECTIONS = [
  { value: undefined, label: "All sailings" },
  { value: "to_theme_park" as const, label: "To the theme park" },
  { value: "to_island" as const, label: "To the island" },
];

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * The public ferry page. Replaces the "coming soon" waitlist with the real
 * timetable, and states the hotel-booking rule up front — a visitor should
 * learn they need a stay before they pick a sailing, not after.
 */
export function FerryLandingPage() {
  const [direction, setDirection] = useState<
    "to_theme_park" | "to_island" | undefined
  >(undefined);

  const {
    data: sailings = [],
    isLoading,
    isError,
    error,
  } = useQuery(bookableSailingsQueryOptions({ direction }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="bg-series-ferry/15 mx-auto flex size-16 items-center justify-center rounded-full">
          <Anchor className="text-series-ferry size-8" />
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Ferry service
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Daily sailings between the island and the theme park.
        </p>
        <div className="mt-4 flex justify-center">
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <BedDouble className="size-3.5" />
            Return ferry included free with every hotel stay
          </Badge>
        </div>
      </div>

      <Card className="glass-data mt-10 overflow-hidden border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Clock className="text-series-ferry size-4" />
              Upcoming sailings
            </h2>
            <div className="flex flex-wrap gap-2">
              {DIRECTIONS.map((option) => (
                <Button
                  key={option.label}
                  variant={direction === option.value ? "default" : "outline"}
                  size="sm"
                  aria-pressed={direction === option.value}
                  onClick={() => setDirection(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              <Note>Loading the timetable…</Note>
            ) : isError ? (
              <Note>
                {error instanceof Error
                  ? error.message
                  : "Could not load sailings."}
              </Note>
            ) : sailings.length === 0 ? (
              <Note>
                No sailings are open for booking right now. Please check back
                soon.
              </Note>
            ) : (
              sailings.map((sailing) => (
                <SailingRow key={sailing.id} sailing={sailing} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="glass-data-strong mt-8 rounded-2xl border-border/60 p-8 text-center">
        <h2 className="text-xl font-semibold">How ferry travel works</h2>
        <ol className="text-muted-foreground mx-auto mt-4 max-w-lg space-y-2 text-left text-sm">
          <li>
            <span className="text-foreground font-medium">1.</span> Book a hotel
            stay — ferry travel comes with it.
          </li>
          <li>
            <span className="text-foreground font-medium">2.</span> Your return
            passes are issued straight away: out on your arrival day, back on
            your departure day.
          </li>
          <li>
            <span className="text-foreground font-medium">3.</span> Show the
            pass at the jetty to board — you will find it under My bookings.
          </li>
          <li>
            <span className="text-foreground font-medium">4.</span> Want a
            different sailing? Buy a seat on any departure within your stay. It
            replaces the included pass for that leg.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/hotels">Browse hotel stays</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/ferry/book">Book an extra sailing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SailingRow({ sailing }: { sailing: BookableSailing }) {
  return (
    <div className="border-border/60 bg-background/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
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
      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" />
          {sailing.remainingSeats} seat
          {sailing.remainingSeats === 1 ? "" : "s"} left
        </span>
        <span className="text-foreground font-medium tabular-nums">
          {gbp(Number(sailing.basePrice))}
        </span>
      </div>
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
