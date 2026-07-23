import { createFileRoute } from "@tanstack/react-router";
import { ParkDashboardPage } from "~/features/park/pages/park-dashboard-page";
import { parkDashboardQueryOptions } from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(parkDashboardQueryOptions),
  component: ParkDashboardPage,
});
