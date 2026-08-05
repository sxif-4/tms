import { createFileRoute } from "@tanstack/react-router";
import { activeAdvertisementsQueryOptions } from "~/features/advertisements/queries";
import { HomePage } from "~/features/hotel-browsing/pages/home-page";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";
import {
  publicParkEventsQueryOptions,
  upcomingParkSchedulesQueryOptions,
} from "~/features/park-browsing/queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publicHotelsQueryOptions()),
      context.queryClient.ensureQueryData(
        activeAdvertisementsQueryOptions("homepage"),
      ),
      context.queryClient.ensureQueryData(publicParkEventsQueryOptions()),
      context.queryClient.ensureQueryData(upcomingParkSchedulesQueryOptions(3)),
    ]),
  component: HomePage,
});
