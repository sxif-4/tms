import { createFileRoute } from "@tanstack/react-router";
import { defaultStay } from "~/features/hotels/constants";
import { NewBookingPage } from "~/features/hotels/pages/new-booking-page";
import {
  availabilityQueryOptions,
  hotelsQueryOptions,
} from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/hotel/bookings/new")({
  loader: async ({ context }) => {
    const hotels =
      await context.queryClient.ensureQueryData(hotelsQueryOptions);
    // `useCurrentHotel` opens on the first scoped hotel, so tonight's inventory
    // for it can be fetched here — the desk sees rooms without a loading flash.
    const hotelId = hotels[0]?.id;
    if (hotelId == null) return;

    const { checkIn, checkOut } = defaultStay();
    await context.queryClient.ensureQueryData(
      availabilityQueryOptions(hotelId, checkIn, checkOut),
    );
  },
  component: NewBookingPage,
});
