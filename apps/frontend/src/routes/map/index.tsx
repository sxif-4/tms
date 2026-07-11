import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { mapSearchSchema } from "~/features/map-locations/constants";
import { IslandMapPage } from "~/features/map-locations/pages/island-map-page";
import {
  mapLocationsQueryOptions,
  publicHotelPinsQueryOptions,
} from "~/features/map-locations/queries";

export const Route = createFileRoute("/map/")({
  validateSearch: mapSearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(mapLocationsQueryOptions),
      context.queryClient.ensureQueryData(publicHotelPinsQueryOptions),
    ]),
  component: MapRoute,
});

function MapRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <IslandMapPage
      search={search}
      onTypeChange={(type) => navigate({ search: (prev) => ({ ...prev, type }) })}
    />
  );
}
