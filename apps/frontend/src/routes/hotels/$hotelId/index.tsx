import { createFileRoute } from "@tanstack/react-router";
import { HotelDetailPage } from "~/features/hotel-browsing/pages/hotel-detail-page";
import { publicHotelQueryOptions } from "~/features/hotel-browsing/queries";

export const Route = createFileRoute("/hotels/$hotelId/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicHotelQueryOptions(Number(params.hotelId)),
    ),
  component: HotelDetailRoute,
});

function HotelDetailRoute() {
  const { hotelId } = Route.useParams();
  return <HotelDetailPage hotelId={Number(hotelId)} />;
}
