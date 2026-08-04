import { createFileRoute } from "@tanstack/react-router";
import { ThemeParkPage } from "~/features/park-browsing/pages/theme-park-page";
import {
  publicParkEventsQueryOptions,
  publicTicketTypesQueryOptions,
} from "~/features/park-browsing/queries";

export const Route = createFileRoute("/theme-park/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publicTicketTypesQueryOptions),
      context.queryClient.ensureQueryData(publicParkEventsQueryOptions()),
    ]),
  component: ThemeParkPage,
});
