import { createFileRoute } from "@tanstack/react-router";
import { HotelDashboardPage } from "~/features/hotels/pages/hotel-dashboard-page";
import { hotelsQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(hotelsQueryOptions),
  component: HotelDashboardPage,
});
