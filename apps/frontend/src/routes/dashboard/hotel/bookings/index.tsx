import { createFileRoute } from "@tanstack/react-router";
import { HotelBookingsPage } from "~/features/hotels/pages/hotel-bookings-page";
import { hotelsQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/bookings/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(hotelsQueryOptions),
  component: HotelBookingsPage,
});
