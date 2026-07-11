import { createFileRoute } from "@tanstack/react-router";
import { HotelBookPage } from "~/features/hotel-browsing/pages/hotel-book-page";
import { publicHotelQueryOptions } from "~/features/hotel-browsing/queries";

export const Route = createFileRoute("/hotels/$hotelId/book")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicHotelQueryOptions(Number(params.hotelId)),
    ),
  component: HotelBookRoute,
});

function HotelBookRoute() {
  const { hotelId } = Route.useParams();
  return <HotelBookPage hotelId={Number(hotelId)} />;
}
