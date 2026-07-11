import { createFileRoute } from "@tanstack/react-router";
import { HotelReportsPage } from "~/features/hotels/pages/hotel-reports-page";
import { hotelsQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/reports/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(hotelsQueryOptions),
  component: HotelReportsPage,
});
