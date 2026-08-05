import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeading } from "~/components/page-heading";
import { DirectionBadge } from "~/features/ferry/components/ferry-badges";
import { FerrySalesChart } from "~/features/ferry/components/ferry-sales-chart";
import { FERRY_SCHEDULE_STATUS_LABELS, gbp } from "~/features/ferry/constants";
import {
  ferryRoutesReportQueryOptions,
  ferrySalesReportQueryOptions,
  ferryTripsReportQueryOptions,
} from "~/features/ferry/queries";

type GroupBy = "day" | "week" | "month";

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function FerryReportsPage() {
  const defaults = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    const to = new Date(now);
    to.setDate(to.getDate() + 30);
    return { from: toDateInput(from), to: toDateInput(to) };
  }, []);

  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  const range = useMemo(() => ({ from, to }), [from, to]);

  const sales = useQuery(ferrySalesReportQueryOptions({ ...range, groupBy }));
  const trips = useQuery(ferryTripsReportQueryOptions(range));
  const routes = useQuery(ferryRoutesReportQueryOptions(range));

  const totals = useMemo(() => {
    const rows = sales.data ?? [];
    return {
      bookings: rows.reduce((sum, row) => sum + row.bookings, 0),
      passengers: rows.reduce((sum, row) => sum + row.passengers, 0),
      revenue: rows.reduce((sum, row) => sum + row.revenue, 0),
    };
  }, [sales.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Reporting period</CardTitle>
          <CardDescription>
            Bookings are counted when requested; revenue when the fare was
            actually taken.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <Label htmlFor="report-from">From</Label>
            <Input
              id="report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-44"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="report-to">To</Label>
            <Input
              id="report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-44"
            />
          </div>
          <div className="grid gap-2">
            <Label>Group by</Label>
            <div className="flex gap-2">
              {(["day", "week", "month"] as const).map((option) => (
                <Button
                  key={option}
                  variant={groupBy === option ? "default" : "outline"}
                  size="sm"
                  aria-pressed={groupBy === option}
                  onClick={() => setGroupBy(option)}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TotalCard label="Bookings" value={String(totals.bookings)} />
        <TotalCard label="Passengers" value={String(totals.passengers)} />
        <TotalCard label="Revenue" value={gbp(totals.revenue)} />
      </section>

      <Card className="border-border/60 p-4">
        <CardHeader className="p-0">
          <CardTitle>Sales over time</CardTitle>
          <CardDescription>
            Fares collected on issued ferry passes. Refunded bookings drop out.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {sales.isLoading ? (
            <div className="bg-muted h-72 animate-pulse rounded-lg" />
          ) : sales.isError ? (
            <ErrorNote error={sales.error} fallback="Failed to load sales." />
          ) : (sales.data ?? []).length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No ferry activity in this period.
            </p>
          ) : (
            <FerrySalesChart data={sales.data ?? []} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Trip report</CardTitle>
          <CardDescription>
            Every sailing in the period. No-shows are only counted once a
            sailing has actually departed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trips.isLoading ? (
            <Muted>Loading sailings…</Muted>
          ) : trips.isError ? (
            <ErrorNote error={trips.error} fallback="Failed to load trips." />
          ) : (trips.data ?? []).length === 0 ? (
            <Muted>No sailings in this period.</Muted>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Departure</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Load</TableHead>
                    <TableHead className="text-right">Boarded</TableHead>
                    <TableHead className="text-right">No-shows</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(trips.data ?? []).map((trip) => (
                    <TableRow key={trip.scheduleId}>
                      <TableCell className="whitespace-nowrap">
                        {fmtDateTime(trip.departureAt)}
                      </TableCell>
                      <TableCell>{trip.routeName}</TableCell>
                      <TableCell>
                        <DirectionBadge direction={trip.direction} />
                      </TableCell>
                      <TableCell>
                        {FERRY_SCHEDULE_STATUS_LABELS[trip.status]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {trip.booked}/{trip.capacity} · {trip.loadFactor}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {trip.validated}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {trip.noShows ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {gbp(trip.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            to="/dashboard/ferry/schedules/$scheduleId/manifest"
                            params={{ scheduleId: String(trip.scheduleId) }}
                          >
                            Manifest
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>By route</CardTitle>
          <CardDescription>
            Which services carry the traffic across the period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routes.isLoading ? (
            <Muted>Loading routes…</Muted>
          ) : routes.isError ? (
            <ErrorNote error={routes.error} fallback="Failed to load routes." />
          ) : (routes.data ?? []).length === 0 ? (
            <Muted>No routes yet.</Muted>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead className="text-right">Sailings</TableHead>
                    <TableHead className="text-right">Passengers</TableHead>
                    <TableHead className="text-right">Avg. load</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(routes.data ?? []).map((route) => (
                    <TableRow key={route.routeId}>
                      <TableCell>{route.routeName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {route.sailings}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {route.passengers}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {route.averageLoad}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {gbp(route.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TotalCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/70 text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
      {children}
    </div>
  );
}

function ErrorNote({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
      {error instanceof Error ? error.message : fallback}
    </div>
  );
}
