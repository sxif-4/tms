import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ParkBrowseSkeleton } from "~/features/park-browsing/components/park-skeletons";
import {
  parkEventsSearchSchema,
  type ParkEventsSearch,
} from "~/features/park-browsing/constants";
import { ThemeParkPage } from "~/features/park-browsing/pages/theme-park-page";
import {
  publicParkEventsQueryOptions,
  publicTicketTypesQueryOptions,
} from "~/features/park-browsing/queries";

/**
 * The park's single browsing surface: hero, what's on, how it works, tickets.
 * Filters live in the URL so a filtered view stays shareable — this route
 * absorbed the old `/theme-park/events` page, which showed the same cards one
 * click further away.
 */
export const Route = createFileRoute("/theme-park/")({
  validateSearch: parkEventsSearchSchema,
  pendingComponent: ParkBrowseSkeleton,
  loaderDeps: ({ search }) => ({
    eventType: search.eventType,
    locationType: search.locationType,
  }),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publicTicketTypesQueryOptions),
      context.queryClient.ensureQueryData(publicParkEventsQueryOptions(deps)),
    ]),
  component: ThemeParkRoute,
});

function ThemeParkRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <ThemeParkPage
      search={search}
      onSearchChange={(next: ParkEventsSearch) =>
        void navigate({ search: next })
      }
    />
  );
}
