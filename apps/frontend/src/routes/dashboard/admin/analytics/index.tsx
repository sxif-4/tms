import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "~/features/reports/pages/analytics-page";
import {
  overviewQueryOptions,
  salesQueryOptions,
  usageQueryOptions,
} from "~/features/reports/queries";

export const Route = createFileRoute("/dashboard/admin/analytics/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(overviewQueryOptions),
      context.queryClient.ensureQueryData(salesQueryOptions),
      context.queryClient.ensureQueryData(usageQueryOptions),
    ]);
  },
  component: AnalyticsPage,
});
