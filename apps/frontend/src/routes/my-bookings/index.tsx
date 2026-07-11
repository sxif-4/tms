import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyBookingsPage } from "~/features/hotel-browsing/pages/my-bookings-page";
import { myHotelBookingsQueryOptions } from "~/features/hotel-browsing/queries";

export const Route = createFileRoute("/my-bookings/")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(myHotelBookingsQueryOptions),
  component: MyBookingsPage,
});
