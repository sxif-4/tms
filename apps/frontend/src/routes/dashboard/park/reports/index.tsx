import { createFileRoute } from "@tanstack/react-router";
import { ParkReportsPage } from "~/features/park/pages/park-reports-page";
import {
  parkEventsReportQueryOptions,
  parkSalesReportQueryOptions,
  parkVisitorsReportQueryOptions,
} from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/reports/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        parkSalesReportQueryOptions(undefined, undefined, "day"),
      ),
      context.queryClient.ensureQueryData(
        parkSalesReportQueryOptions(undefined, undefined, "ticketType"),
      ),
      context.queryClient.ensureQueryData(
        parkSalesReportQueryOptions(undefined, undefined, "channel"),
      ),
      context.queryClient.ensureQueryData(parkVisitorsReportQueryOptions()),
      context.queryClient.ensureQueryData(parkEventsReportQueryOptions()),
    ]);
  },
  component: ParkReportsPage,
});
