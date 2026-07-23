import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  BanknoteIcon,
  CalendarOffIcon,
  GaugeIcon,
  ScanLineIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
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
import { EmptyState } from "~/features/hotels/components/empty-state";
import { StatCard } from "~/features/reports/components/stat-card";
import { CapacityBar } from "../components/capacity-bar";
import { ParkSalesChart } from "../components/park-sales-chart";
import { TicketStatusBadge } from "../components/park-badges";
import { gbp } from "../constants";
import { parkDashboardQueryOptions } from "../queries";
import type { ScheduleFillRow, TicketStatus } from "../types";

/** Dashboard schedule rows carry `startAt` as unix seconds, not an ISO string. */
const fmtUnix = (s: number) =>
  new Date(s * 1000).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDay = (key: string) =>
  new Date(key).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export function ParkDashboardPage() {
  const { data } = useSuspenseQuery(parkDashboardQueryOptions);
  const { kpis, capacityAlerts, todaysGate, salesTrend, upcomingSchedules } =
    data;

  const alertCount =
    capacityAlerts.schedulesNearCapacity.length +
    capacityAlerts.daysNearCapacity.length +
    capacityAlerts.closedDays.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            Theme park dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Today at a glance across tickets, revenue and the gate.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/park/gate">
            <ScanLineIcon data-icon="inline-start" />
            Open gate
          </Link>
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tickets sold today"
          value={kpis.ticketsSoldToday.total}
          hint={`${kpis.ticketsSoldToday.online} online / ${kpis.ticketsSoldToday.gate} gate`}
          icon={TicketIcon}
        />
        <StatCard
          label="Revenue today"
          value={gbp(kpis.revenueToday)}
          hint={`${gbp(kpis.revenueLast30Days)} last 30 days`}
          icon={BanknoteIcon}
        />
        <StatCard
          label="Checked in today"
          value={kpis.visitorsCheckedInToday}
          hint={`${todaysGate.notArrived} still to arrive`}
          icon={UsersIcon}
        />
        <StatCard
          label="Today's park fill"
          value={
            kpis.todaysFill.isClosed ? "Closed" : `${kpis.todaysFill.fillRate}%`
          }
          hint={
            kpis.todaysFill.isClosed
              ? "The park is shut today"
              : `${kpis.todaysFill.sold} of ${kpis.todaysFill.capacity} tickets sold`
          }
          icon={GaugeIcon}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Capacity alerts</CardTitle>
          <CardDescription>
            Schedules and days that need attention before they sell out.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {alertCount === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing needs attention — no schedules or days are near capacity.
            </p>
          ) : (
            <>
              {capacityAlerts.schedulesNearCapacity.length > 0 && (
                <AlertGroup
                  icon={AlertTriangleIcon}
                  title="Schedules nearly full"
                >
                  {capacityAlerts.schedulesNearCapacity.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {s.eventName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {fmtUnix(s.startAt)}
                        </span>
                      </div>
                      <CapacityBar
                        booked={s.booked}
                        capacity={s.capacity}
                        className="w-40"
                      />
                    </div>
                  ))}
                </AlertGroup>
              )}

              {capacityAlerts.daysNearCapacity.length > 0 && (
                <AlertGroup icon={AlertTriangleIcon} title="Days nearly sold out">
                  {capacityAlerts.daysNearCapacity.map((d) => (
                    <div
                      key={d.date}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <span className="text-sm font-medium">
                        {fmtDay(d.date)}
                      </span>
                      <CapacityBar
                        booked={d.sold}
                        capacity={d.capacity}
                        className="w-40"
                      />
                    </div>
                  ))}
                </AlertGroup>
              )}

              {capacityAlerts.closedDays.length > 0 && (
                <AlertGroup
                  icon={CalendarOffIcon}
                  title="Closed in the next 14 days"
                >
                  {capacityAlerts.closedDays.map((d) => (
                    <div
                      key={d.date}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <span className="text-sm font-medium">
                        {fmtDay(d.date)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {d.note ?? "Closed"}
                      </span>
                    </div>
                  ))}
                </AlertGroup>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle>Sales over time</CardTitle>
          <CardDescription>
            Park revenue — tickets and event bookings — over the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {salesTrend.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No sales recorded in the last 30 days.
            </p>
          ) : (
            <ParkSalesChart data={salesTrend} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today at the gate</CardTitle>
            <CardDescription>
              {todaysGate.checkedIn} of {todaysGate.expected} visitors checked
              in · {todaysGate.notArrived} still to arrive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysGate.items.length === 0 ? (
              <EmptyState
                icon={ScanLineIcon}
                title="No tickets for today"
                description="Nobody is booked in for today yet. Walk-up sales will appear here as they're rung up."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Visitor</TableHead>
                    <TableHead className="text-right">Party</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysGate.items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">
                        {t.ticketReference}
                      </TableCell>
                      <TableCell>{t.buyerName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t.quantity}
                      </TableCell>
                      <TableCell>
                        <TicketStatusBadge status={t.status as TicketStatus} />
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
            <CardTitle>Upcoming schedules</CardTitle>
            <CardDescription>
              The next events to run, and how full they are.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSchedules.length === 0 ? (
              <EmptyState
                icon={TicketIcon}
                title="No upcoming schedules"
                description="Add a schedule to an event so visitors can book seats."
                action={
                  <Button asChild>
                    <Link to="/dashboard/park/events">Go to Events</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {upcomingSchedules.map((s: ScheduleFillRow) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{s.eventName}</span>
                      <span className="text-muted-foreground text-xs">
                        {fmtUnix(s.startAt)}
                      </span>
                    </div>
                    <CapacityBar
                      booked={s.booked}
                      capacity={s.capacity}
                      className="w-40"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof AlertTriangleIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
