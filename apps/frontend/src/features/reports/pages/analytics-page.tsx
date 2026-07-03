import { useSuspenseQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  PoundSterlingIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  RevenueByDomainChart,
  type DomainTotal,
} from "../components/revenue-by-domain-chart";
import { RevenueOverTimeChart } from "../components/revenue-over-time-chart";
import { StatCard } from "../components/stat-card";
import { DOMAINS, gbp } from "../constants";
import {
  overviewQueryOptions,
  salesQueryOptions,
  usageQueryOptions,
} from "../queries";

export function AnalyticsPage() {
  const { data: overview } = useSuspenseQuery(overviewQueryOptions);
  const { data: sales } = useSuspenseQuery(salesQueryOptions);
  const { data: usage } = useSuspenseQuery(usageQueryOptions);

  const totals: DomainTotal[] = DOMAINS.map((d) => ({
    domain: d.key,
    label: d.label,
    color: d.color,
    revenue: sales.reduce((sum, p) => sum + p[d.key], 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Sales and usage across every domain.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={overview.totalUsers}
          hint="Registered accounts"
          icon={UsersIcon}
        />
        <StatCard
          label="Active bookings"
          value={overview.activeBookings}
          hint="Confirmed &amp; upcoming"
          icon={CalendarCheckIcon}
        />
        <StatCard
          label="Revenue"
          value={gbp(overview.revenue)}
          hint="Completed payments"
          icon={PoundSterlingIcon}
        />
        <StatCard
          label="Tickets sold"
          value={overview.ticketsSold}
          hint="Park &amp; event tickets"
          icon={TicketIcon}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle>Revenue over time</CardTitle>
            <CardDescription>By service date, split by domain</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RevenueOverTimeChart data={sales} />
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardHeader className="p-0">
            <CardTitle>Revenue by domain</CardTitle>
            <CardDescription>Total booked value per domain</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RevenueByDomainChart data={totals} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {usage.map((u) => {
          const label = DOMAINS.find((d) => d.key === u.domain)?.label ?? u.domain;
          return (
            <Card key={u.domain}>
              <CardHeader>
                <CardDescription>{label} capacity</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {u.utilization}%
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(u.utilization, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {u.booked} of {u.capacity} seats booked
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
