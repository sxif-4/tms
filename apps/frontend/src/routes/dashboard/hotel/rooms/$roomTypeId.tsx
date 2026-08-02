import { createFileRoute } from "@tanstack/react-router";
import { EditRoomTypePage } from "~/features/hotels/pages/room-type-form-page";
import { roomTypeQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/rooms/$roomTypeId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      roomTypeQueryOptions(Number(params.roomTypeId)),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { roomTypeId } = Route.useParams();
  return <EditRoomTypePage roomTypeId={Number(roomTypeId)} />;
}
