import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage } from "~/features/hotels/pages/rooms-page";
import { hotelsQueryOptions } from "~/features/hotels/queries";

// Room types are per-hotel, so they can only be prefetched once the page has
// resolved which hotel the staff member is currently viewing.
export const Route = createFileRoute("/dashboard/hotel/rooms/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(hotelsQueryOptions),
  component: RoomsPage,
});
