import { createFileRoute, redirect } from "@tanstack/react-router";
import { myFerryBookingsQueryOptions } from "~/features/ferry-browsing/queries";
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
  // The page spans four domains now — every panel is suspense-read, so all four
  // must be warm before it renders.
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(myHotelBookingsQueryOptions),
      context.queryClient.ensureQueryData(myParkTicketsQueryOptions),
      context.queryClient.ensureQueryData(myEventBookingsQueryOptions),
      context.queryClient.ensureQueryData(myFerryBookingsQueryOptions),
    ]),
  component: MyBookingsPage,
});
