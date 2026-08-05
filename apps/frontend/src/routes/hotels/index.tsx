import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { hotelSearchSchema } from "~/features/hotel-browsing/constants";
import { HotelsBrowsePage } from "~/features/hotel-browsing/pages/hotels-browse-page";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";

export const Route = createFileRoute("/hotels/")({
  validateSearch: hotelSearchSchema,
  // Guests filters server-side, so the loader has to prefetch the *filtered*
  // list — otherwise landing on /hotels?guests=2 server-renders the empty state
  // and only corrects itself after hydration.
  loaderDeps: ({ search }) => ({ guests: search.guests }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      publicHotelsQueryOptions({ guests: deps.guests }),
    ),
  component: HotelsBrowseRoute,
});

function HotelsBrowseRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <HotelsBrowsePage
      search={search}
      onSearchChange={(next) =>
        navigate({
          search: (prev) => ({ ...prev, ...next }),
          // Filtering is one continuous action, not a series of destinations:
          // don't stack history entries and don't yank the page back to the top.
          replace: true,
          resetScroll: false,
        })
      }
    />
  );
}
