import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  parkEventsSearchSchema,
  type ParkEventsSearch,
} from "~/features/park-browsing/constants";
import { ParkBrowseSkeleton } from "~/features/park-browsing/components/park-skeletons";
import { ParkEventsPage } from "~/features/park-browsing/pages/park-events-page";
import { publicParkEventsQueryOptions } from "~/features/park-browsing/queries";

export const Route = createFileRoute("/theme-park/events/")({
  validateSearch: parkEventsSearchSchema,
  pendingComponent: ParkBrowseSkeleton,
  loaderDeps: ({ search }) => ({
    eventType: search.eventType,
    locationType: search.locationType,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(publicParkEventsQueryOptions(deps)),
  component: ParkEventsRoute,
});

function ParkEventsRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <ParkEventsPage
      search={search}
      onSearchChange={(next: ParkEventsSearch) =>
        void navigate({ search: next })
      }
    />
  );
}
