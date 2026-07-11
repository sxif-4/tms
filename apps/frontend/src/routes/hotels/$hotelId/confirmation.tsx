import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { HotelBookingConfirmationPage } from "~/features/hotel-browsing/pages/hotel-booking-confirmation-page";
import { myHotelBookingsQueryOptions } from "~/features/hotel-browsing/queries";

const searchSchema = z.object({
  ref: z.string().optional(),
});

export const Route = createFileRoute("/hotels/$hotelId/confirmation")({
  validateSearch: searchSchema,
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(myHotelBookingsQueryOptions),
  component: ConfirmationRoute,
});

function ConfirmationRoute() {
  const { hotelId } = Route.useParams();
  const { ref } = Route.useSearch();
  return (
    <HotelBookingConfirmationPage
      hotelId={Number(hotelId)}
      reference={ref}
    />
  );
}
