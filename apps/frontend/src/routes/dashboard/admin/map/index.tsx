import { createFileRoute } from "@tanstack/react-router";
import { MapLocationsPage } from "~/features/map-locations/pages/map-locations-page";
import { mapLocationsQueryOptions } from "~/features/map-locations/queries";

export const Route = createFileRoute("/dashboard/admin/map/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(mapLocationsQueryOptions),
  component: MapLocationsPage,
});
