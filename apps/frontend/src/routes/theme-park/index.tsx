import { createFileRoute } from "@tanstack/react-router";
import { ParkBrowseSkeleton } from "~/features/park-browsing/components/park-skeletons";
import { ThemeParkPage } from "~/features/park-browsing/pages/theme-park-page";
import {
  publicParkEventsQueryOptions,
  publicTicketTypesQueryOptions,
} from "~/features/park-browsing/queries";

export const Route = createFileRoute("/theme-park/")({
  pendingComponent: ParkBrowseSkeleton,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publicTicketTypesQueryOptions),
      context.queryClient.ensureQueryData(publicParkEventsQueryOptions()),
    ]),
  component: ThemeParkPage,
});
