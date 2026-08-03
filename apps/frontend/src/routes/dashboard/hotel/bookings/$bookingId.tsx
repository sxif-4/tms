import { createFileRoute } from "@tanstack/react-router";
import { BookingDetailPage } from "~/features/hotels/pages/booking-detail-page";
import { hotelBookingQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/bookings/$bookingId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      hotelBookingQueryOptions(Number(params.bookingId)),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { bookingId } = Route.useParams();
  return <BookingDetailPage bookingId={Number(bookingId)} />;
}
