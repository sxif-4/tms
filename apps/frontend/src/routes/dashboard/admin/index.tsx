import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BedDoubleIcon,
  LogInIcon,
  LogOutIcon,
  PoundSterlingIcon,
} from "lucide-react";
import { PageHeading } from "~/components/page-heading";
import { auditLogsQueryOptions } from "~/features/audit-logs/queries";
import { AttentionTile } from "~/features/dashboard/components/attention-tile";
import { OccupancyCard } from "~/features/dashboard/components/occupancy-card";
import { RecentActivityCard } from "~/features/dashboard/components/recent-activity-card";
import { ScheduleFillCard } from "~/features/dashboard/components/schedule-fill-card";
import { gbp } from "~/features/reports/constants";
import {
  occupancyQueryOptions,
  operationsQueryOptions,
  scheduleFillQueryOptions,
} from "~/features/reports/queries";

/** How many audit entries the overview feed shows before "view all". */
const ACTIVITY_FEED_SIZE = 6;

export const Route = createFileRoute("/dashboard/admin/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(operationsQueryOptions),
      context.queryClient.ensureQueryData(occupancyQueryOptions),
      context.queryClient.ensureQueryData(scheduleFillQueryOptions),
      context.queryClient.ensureQueryData(auditLogsQueryOptions(1, undefined)),
    ]),
  component: AdminDashboardPage,
});

/**
 * The admin's landing page answers "what needs me today", not "how did we do
 * last quarter" — the revenue and trend charts live on /analytics so the two
 * pages stop showing the same four numbers.
 */
function AdminDashboardPage() {
  const { data: ops } = useSuspenseQuery(operationsQueryOptions);
  const { data: occupancy } = useSuspenseQuery(occupancyQueryOptions);
  const { data: schedules } = useSuspenseQuery(scheduleFillQueryOptions);
  const { data: audit } = useSuspenseQuery(auditLogsQueryOptions(1, undefined));

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AttentionTile
          label="Uncollected"
          value={gbp(ops.pendingPaymentAmount)}
          hint={`${ops.pendingPaymentCount} payment${ops.pendingPaymentCount === 1 ? "" : "s"} still pending`}
          icon={PoundSterlingIcon}
          to="/dashboard/admin/customers"
          needsAttention={ops.pendingPaymentCount > 0}
        />
        <AttentionTile
          label="Rooms to assign"
          value={ops.unassignedRooms}
          hint="Live bookings with no room yet"
          icon={BedDoubleIcon}
          to="/dashboard/hotel/bookings"
          needsAttention={ops.unassignedRooms > 0}
        />
        <AttentionTile
          label="Arriving today"
          value={ops.arrivalsToday}
          hint={`${ops.inHouse} currently in house`}
          icon={LogInIcon}
          to="/dashboard/hotel/bookings"
          needsAttention={ops.arrivalsToday > 0}
        />
        <AttentionTile
          label="Departing today"
          value={ops.departuresToday}
          hint={
            ops.refundedCount > 0
              ? `${gbp(ops.refundedAmount)} refunded to date`
              : undefined
          }
          icon={LogOutIcon}
          to="/dashboard/hotel/bookings"
          needsAttention={ops.departuresToday > 0}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScheduleFillCard data={schedules} />
        <OccupancyCard data={occupancy} />
      </section>

      <RecentActivityCard logs={audit.items.slice(0, ACTIVITY_FEED_SIZE)} />
    </div>
  );
}
