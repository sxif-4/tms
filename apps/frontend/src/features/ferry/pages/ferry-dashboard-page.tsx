import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BadgeCheckIcon,
  CalendarClockIcon,
  Clock3Icon,
  SearchIcon,
  ShipWheelIcon,
  TicketCheckIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
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
import { PageHeading } from "~/components/page-heading";
import {
  DirectionBadge,
  FerryBookingStatusBadge,
  HotelStatusBadge,
} from "~/features/ferry/components/ferry-badges";
import { FerryCapacityBar } from "~/features/ferry/components/ferry-capacity-bar";
import { ferryDashboardQueryOptions } from "~/features/ferry/queries";
import { lookupFerryBookingServerFn } from "~/features/ferry/server";
import type { FerryBooking } from "~/features/ferry/bookings-types";

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtRelative = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};

export function FerryDashboardPage() {
  const { data, isLoading, isError, error } = useQuery(
    ferryDashboardQueryOptions,
  );

  const stats = data?.stats;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <header className="border-border/60 from-sky-500/10 via-card to-cyan-500/10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-linear-to-br p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <ShipWheelIcon className="size-3.5" />
            Ferry operations
          </Badge>
          <Badge variant="outline">Hotel-booking validation enabled</Badge>
        </div>
        <Button asChild className="w-fit">
          <Link to="/dashboard/ferry/schedules">Create new schedule</Link>
        </Button>
      </header>

      {isError ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
          {error instanceof Error
            ? error.message
            : "Failed to load the ferry dashboard."}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Awaiting a pass"
          value={stats ? String(stats.pendingPasses) : "—"}
          hint="Requests needing staff action"
          icon={TicketCheckIcon}
          loading={isLoading}
        />
        <StatCard
          label="Today's departures"
          value={stats ? String(stats.todaysDepartures) : "—"}
          hint={
            data
              ? `${data.routeOccupancy.length} active route${data.routeOccupancy.length === 1 ? "" : "s"}`
              : ""
          }
          icon={CalendarClockIcon}
          loading={isLoading}
        />
        <StatCard
          label="Seats filled"
          value={stats ? `${stats.todaysFill.fillRate}%` : "—"}
          hint={
            stats
              ? `${stats.todaysFill.booked} of ${stats.todaysFill.capacity} on today's sailings`
              : ""
          }
          icon={UsersIcon}
          loading={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PassLookupCard />

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Next sailings</CardTitle>
            <CardDescription>
              The upcoming departures still taking bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Muted>Loading sailings…</Muted>
            ) : !data || data.nextSailings.length === 0 ? (
              <Muted>No upcoming sailings scheduled.</Muted>
            ) : (
              data.nextSailings.map((sailing) => (
                <div
                  key={sailing.id}
                  className="border-border/60 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {fmtDateTime(sailing.departureAt)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {sailing.routeName}
                      </p>
                    </div>
                    <DirectionBadge direction={sailing.direction} />
                  </div>
                  <FerryCapacityBar
                    className="mt-3"
                    booked={sailing.booked}
                    capacity={sailing.capacity}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Route occupancy</CardTitle>
            <CardDescription>
              Seats booked against seats offered, across every sailing on the
              route.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Muted>Loading routes…</Muted>
            ) : !data || data.routeOccupancy.length === 0 ? (
              <Muted>No routes yet.</Muted>
            ) : (
              data.routeOccupancy.map((route) => (
                <div
                  key={route.routeId}
                  className="border-border/60 rounded-lg border px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{route.routeName}</p>
                    <span className="text-muted-foreground text-sm">
                      {route.sailings} sailing{route.sailings === 1 ? "" : "s"}
                    </span>
                  </div>
                  <FerryCapacityBar
                    className="mt-2"
                    booked={route.booked}
                    capacity={route.capacity}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Recent requests</CardTitle>
                <CardDescription>
                  Newest bookings and the stay behind each.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard/ferry/bookings">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Muted>Loading requests…</Muted>
            ) : !data || data.recentRequests.length === 0 ? (
              <Muted>No ferry bookings yet.</Muted>
            ) : (
              data.recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="border-border/60 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{request.guestName}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {request.bookingReference}
                      </p>
                    </div>
                    <FerryBookingStatusBadge status={request.status} />
                  </div>
                  <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock3Icon className="size-3.5" />
                      {fmtRelative(request.createdAt)}
                    </span>
                    <span>•</span>
                    <span>
                      {request.passengerCount} passenger
                      {request.passengerCount === 1 ? "" : "s"}
                    </span>
                    <HotelStatusBadge status={request.hotelStatus} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/70 text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof UsersIcon;
  loading: boolean;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          <div className="rounded-full bg-cyan-500/10 p-2 text-cyan-700 dark:text-cyan-400">
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tabular-nums">
          {loading ? "…" : value}
        </p>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * The spec's "check booking details" in its quickest form: type a reference,
 * see the real guest, sailing and stay. Deliberately read-only — boarding
 * happens on the validation screen, which this links to.
 */
function PassLookupCard() {
  const [reference, setReference] = useState("");
  const [found, setFound] = useState<FerryBooking | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);

  const lookup = useMutation({
    mutationFn: (bookingReference: string) =>
      lookupFerryBookingServerFn({ data: { bookingReference } }),
    onSuccess: (booking) => {
      setFound(booking);
      setNotFound(null);
    },
    onError: (err) => {
      setFound(null);
      setNotFound(
        err instanceof Error ? err.message : "Could not find that booking",
      );
    },
  });

  const trimmed = reference.trim();

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Check a ferry pass</CardTitle>
            <CardDescription>
              Confirm a visitor has a valid hotel booking before they travel.
            </CardDescription>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <BadgeCheckIcon className="size-3.5" />
            Ready to verify
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="FB-XXXXXXXX"
            className="h-10 font-mono tracking-wider"
            aria-label="Booking reference"
            value={reference}
            onChange={(event) => setReference(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter" && trimmed) lookup.mutate(trimmed);
            }}
          />
          <Button
            className="h-10"
            onClick={() => lookup.mutate(trimmed)}
            disabled={lookup.isPending || !trimmed}
          >
            <SearchIcon data-icon="inline-start" />
            {lookup.isPending ? "Checking…" : "Check"}
          </Button>
        </div>

        {notFound ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border p-4 text-sm">
            <XCircleIcon className="size-5 shrink-0" />
            {notFound}
          </div>
        ) : found ? (
          <div className="border-border/60 bg-muted/30 rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{found.guestName}</p>
                <p className="text-muted-foreground text-sm">
                  {found.hotelName} · {found.hotelBookingReference} ·{" "}
                  {found.passengerCount} passenger
                  {found.passengerCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FerryBookingStatusBadge status={found.status} />
                <HotelStatusBadge status={found.hotelStatus} />
              </div>
            </div>
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1">
                <CalendarClockIcon className="size-4" />
                {found.routeName} ·{" "}
                {new Date(found.departureAt).toLocaleString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/ferry/validate">Go to boarding</Link>
              </Button>
            </div>
          </div>
        ) : (
          <Muted>
            Enter a booking reference to see the guest, their sailing and the
            stay that authorises it.
          </Muted>
        )}
      </CardContent>
    </Card>
  );
}
