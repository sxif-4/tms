import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { hotelSearchSchema } from "~/features/hotel-browsing/constants";
import { HotelsBrowsePage } from "~/features/hotel-browsing/pages/hotels-browse-page";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";

export const Route = createFileRoute("/hotels/")({
  validateSearch: hotelSearchSchema,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(publicHotelsQueryOptions()),
  component: HotelsBrowseRoute,
});

function HotelsBrowseRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <HotelsBrowsePage
      search={search}
      onSearchChange={(next) =>
        navigate({ search: (prev) => ({ ...prev, ...next }) })
      }
    />
  );
}
