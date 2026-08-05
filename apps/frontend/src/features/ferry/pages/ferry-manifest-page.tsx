import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeading } from "~/components/page-heading";
import {
  DirectionBadge,
  FerryBookingStatusBadge,
  ScheduleStatusBadge,
} from "~/features/ferry/components/ferry-badges";
import { FerryCapacityBar } from "~/features/ferry/components/ferry-capacity-bar";
import { ferryManifestQueryOptions } from "~/features/ferry/queries";

const fmtDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
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
 * The physical boarding list an operator carries onto the vessel. Cancelled
 * bookings stay on the sheet with their status showing — a visible withdrawal
 * beats an unexplained gap when you are counting heads at the gangway.
 */
export function FerryManifestPage({ scheduleId }: { scheduleId: number }) {
  const { data, isLoading, isError, error } = useQuery(
    ferryManifestQueryOptions(scheduleId),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <PageHeading />
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/ferry/schedules">
              <ArrowLeftIcon data-icon="inline-start" />
              Schedules
            </Link>
          </Button>
          <Button onClick={() => window.print()} disabled={!data}>
            <PrinterIcon data-icon="inline-start" />
            Print manifest
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Muted>Loading manifest…</Muted>
      ) : isError ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
          {error instanceof Error
            ? error.message
            : "Failed to load the manifest."}
        </div>
      ) : data ? (
        // app.css prints this subtree alone — no sidebar, no buttons.
        <div data-print-root className="flex flex-col gap-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{data.schedule.routeName}</CardTitle>
                  <CardDescription>
                    {data.schedule.origin} → {data.schedule.destination} ·{" "}
                    {fmtDateTime(data.schedule.departureAt)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DirectionBadge direction={data.schedule.direction} />
                  <ScheduleStatusBadge status={data.schedule.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Figure label="Bookings" value={data.totals.bookings} />
                <Figure label="Passengers" value={data.totals.passengers} />
                <Figure label="Boarded" value={data.totals.validated} />
                <Figure label="Seats left" value={data.totals.remaining} />
              </dl>
              <FerryCapacityBar
                booked={data.totals.passengers}
                capacity={data.schedule.capacity}
                className="self-end"
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Passenger list</CardTitle>
              <CardDescription>
                Ordered by what still needs doing — awaiting a pass first,
                boarded last.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.passengers.length === 0 ? (
                <Muted>Nobody is booked on this sailing yet.</Muted>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead className="text-right">Pax</TableHead>
                        <TableHead>Stay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Boarded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.passengers.map((passenger) => (
                        <TableRow
                          key={passenger.id}
                          className={
                            passenger.status === "cancelled"
                              ? "text-muted-foreground line-through"
                              : undefined
                          }
                        >
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {passenger.bookingReference}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {passenger.guestName}
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {passenger.guestEmail}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {passenger.passengerCount}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {passenger.hotelName}
                            <span className="text-muted-foreground block text-xs">
                              {fmtDate(passenger.hotelCheckIn)}–
                              {fmtDate(passenger.hotelCheckOut)} ·{" "}
                              {passenger.hotelBookingReference}
                            </span>
                          </TableCell>
                          <TableCell>
                            <FerryBookingStatusBadge
                              status={passenger.status}
                            />
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {passenger.validatedAt
                              ? fmtDateTime(passenger.validatedAt)
                              : "—"}
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
      ) : null}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
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
