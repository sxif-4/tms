import { createFileRoute } from "@tanstack/react-router";
import { ParkBookingsPage } from "~/features/park/pages/park-bookings-page";
import {
  eventBookingsQueryOptions,
  parkEventsQueryOptions,
} from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/bookings/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(parkEventsQueryOptions()),
      context.queryClient.ensureQueryData(eventBookingsQueryOptions()),
    ]);
  },
  component: ParkBookingsPage,
});
