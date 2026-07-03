import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  PoundSterlingIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { StatCard } from "~/features/reports/components/stat-card";
import { gbp } from "~/features/reports/constants";
import { overviewQueryOptions } from "~/features/reports/queries";

export const Route = createFileRoute("/dashboard/admin/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(overviewQueryOptions),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: overview } = useSuspenseQuery(overviewQueryOptions);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          An overview of activity across the platform.
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link to="/dashboard/admin/users" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Review accounts and manage roles.
              </CardDescription>
              <CardAction>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/dashboard/admin/analytics" className="group">
          <Card className="transition-colors group-hover:ring-foreground/20">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Explore sales and usage reports.
              </CardDescription>
              <CardAction>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardAction>
            </CardHeader>
          </Card>
        </Link>
      </section>
    </div>
  );
}
