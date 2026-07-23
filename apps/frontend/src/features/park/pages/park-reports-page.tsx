import { useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3Icon } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { EmptyState } from "~/features/hotels/components/empty-state";
import { CapacityBar } from "../components/capacity-bar";
import { ParkSalesChart } from "../components/park-sales-chart";
import { EVENT_TYPE_LABELS, TICKET_CHANNEL_LABELS, gbp } from "../constants";
import {
  parkEventsReportQueryOptions,
  parkSalesReportQueryOptions,
  parkVisitorsReportQueryOptions,
} from "../queries";
import type { EventType, SalesRow, TicketChannel } from "../types";

const fmtDay = (key: string) =>
  new Date(key).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function ParkReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const range = { from: from || undefined, to: to || undefined };

  const { data: byDay } = useSuspenseQuery(
    parkSalesReportQueryOptions(range.from, range.to, "day"),
  );
  const { data: byType } = useSuspenseQuery(
    parkSalesReportQueryOptions(range.from, range.to, "ticketType"),
  );
  const { data: byChannel } = useSuspenseQuery(
    parkSalesReportQueryOptions(range.from, range.to, "channel"),
  );
  const { data: visitors } = useSuspenseQuery(
    parkVisitorsReportQueryOptions(range.from, range.to),
  );
  const { data: events } = useSuspenseQuery(
    parkEventsReportQueryOptions(range.from, range.to),
  );

  // The by-day report carries revenue per day — the same shape the chart wants.
  const trend = byDay.map((r) => ({ day: r.key, revenue: r.revenue }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Sales, visitors and event performance. Defaults to the last 30 days
            through the next 30.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="r-from" className="text-xs font-medium">
              From
            </label>
            <Input
              id="r-from"
              type="date"
              className="w-40"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="r-to" className="text-xs font-medium">
              To
            </label>
            <Input
              id="r-to"
              type="date"
              className="w-40"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>Sales over time</CardTitle>
          <CardDescription>
            Park revenue from tickets and event bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {trend.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No sales in this range.
            </p>
          ) : (
            <ParkSalesChart data={trend} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownCard
          title="Revenue by ticket type"
          description="Which tiers visitors actually buy."
          keyHeader="Ticket type"
          rows={byType}
          labelFor={(key) => key}
        />
        <BreakdownCard
          title="Online vs gate"
          description="Where tickets are sold."
          keyHeader="Channel"
          rows={byChannel}
          labelFor={(key) => TICKET_CHANNEL_LABELS[key as TicketChannel] ?? key}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in rate</CardTitle>
          <CardDescription>
            Tickets sold for each day versus visitors who actually turned up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visitors.length === 0 ? (
            <EmptyState
              icon={BarChart3Icon}
              title="No visitor data"
              description="No tickets have a visit date in this range."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Checked in</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((v) => (
                  <TableRow key={v.day}>
                    <TableCell>{fmtDay(v.day)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.sold}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.checkedIn}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.checkInRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event performance</CardTitle>
          <CardDescription>
            Seats sold against capacity for every event that ran in this range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState
              icon={BarChart3Icon}
              title="No events ran"
              description="No event schedules fall inside this range."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Schedules</TableHead>
                  <TableHead className="w-48">Fill rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.eventId}>
                    <TableCell className="font-medium">{e.eventName}</TableCell>
                    <TableCell>
                      {EVENT_TYPE_LABELS[e.eventType as EventType] ??
                        e.eventType}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.schedulesRun}
                    </TableCell>
                    <TableCell>
                      <CapacityBar booked={e.seatsSold} capacity={e.capacity} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {gbp(e.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Shared shape for the two "revenue grouped by X" tables. */
function BreakdownCard({
  title,
  description,
  keyHeader,
  rows,
  labelFor,
}: {
  title: string;
  description: string;
  /** Column header for the grouping key, e.g. "Channel". */
  keyHeader: string;
  rows: SalesRow[];
  labelFor: (key: string) => string;
}) {
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No sales in this range.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{keyHeader}</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">
                    {labelFor(r.key)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.ticketsSold}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {gbp(r.revenue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {total > 0 ? `${Math.round((r.revenue / total) * 100)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
