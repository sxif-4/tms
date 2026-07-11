import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage } from "~/features/hotels/pages/rooms-page";
import { hotelsQueryOptions, roomTypesQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/rooms/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(hotelsQueryOptions),
      context.queryClient.ensureQueryData(roomTypesQueryOptions),
    ]),
  component: RoomsPage,
});
