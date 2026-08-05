import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyBookingsPage } from "~/features/hotel-browsing/pages/my-bookings-page";
import { myHotelBookingsQueryOptions } from "~/features/hotel-browsing/queries";
import {
  myEventBookingsQueryOptions,
  myParkTicketsQueryOptions,
} from "~/features/park-browsing/queries";

export const Route = createFileRoute("/my-bookings/")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  // The page spans three domains now — all three panels are suspense-read, so
  // all three must be warm before it renders.
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(myHotelBookingsQueryOptions),
      context.queryClient.ensureQueryData(myParkTicketsQueryOptions),
      context.queryClient.ensureQueryData(myEventBookingsQueryOptions),
    ]),
  component: MyBookingsPage,
});
