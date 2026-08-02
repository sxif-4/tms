import { createFileRoute } from "@tanstack/react-router";
import { NewRoomTypePage } from "~/features/hotels/pages/room-type-form-page";
import { hotelsQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/rooms/new")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(hotelsQueryOptions),
  component: NewRoomTypePage,
});
