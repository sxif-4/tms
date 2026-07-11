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
import { ActiveEventsCard } from "~/features/dashboard/components/active-events-card";
import { CustomerRequestsCard } from "~/features/dashboard/components/customer-requests-card";
import { ParkMapCard } from "~/features/dashboard/components/park-map-card";
import { RevenueBySourceCard } from "~/features/dashboard/components/revenue-by-source-card";
import { TopHotelsCard } from "~/features/dashboard/components/top-hotels-card";
import { StatCard } from "~/features/reports/components/stat-card";
import { gbp } from "~/features/reports/constants";
import {
  overviewQueryOptions,
  salesQueryOptions,
} from "~/features/reports/queries";

export const Route = createFileRoute("/dashboard/admin/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(overviewQueryOptions),
      context.queryClient.ensureQueryData(salesQueryOptions),
    ]),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: overview } = useSuspenseQuery(overviewQueryOptions);
  const { data: sales } = useSuspenseQuery(salesQueryOptions);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={overview.totalUsers}
          icon={UsersIcon}
        />
        <StatCard
          label="Active bookings"
          value={overview.activeBookings}
          icon={CalendarCheckIcon}
        />
        <StatCard
          label="Revenue"
          value={gbp(overview.revenue)}
          icon={PoundSterlingIcon}
        />
        <StatCard
          label="Tickets sold"
          value={overview.ticketsSold}
          icon={TicketIcon}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueBySourceCard data={sales} />
        <ParkMapCard />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopHotelsCard />
        <ActiveEventsCard />
      </section>
    </div>
  );
}
