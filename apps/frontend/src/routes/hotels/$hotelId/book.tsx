import { createFileRoute } from "@tanstack/react-router";
import {
  bookingDraftSchema,
  isValidStay,
} from "~/features/hotel-browsing/booking-draft";
import { HotelBookPage } from "~/features/hotel-browsing/pages/hotel-book-page";
import {
  hotelAvailabilityQueryOptions,
  publicHotelQueryOptions,
} from "~/features/hotel-browsing/queries";

/**
 * Step 1 of the funnel: still shopping, so the site header stays and no sign-in
 * is required. The draft accumulates in the search params and is handed to
 * /checkout through the URL.
 */
export const Route = createFileRoute("/hotels/$hotelId/book")({
  validateSearch: bookingDraftSchema,
  loaderDeps: ({ search }) => ({
    checkIn: search.checkIn,
    checkOut: search.checkOut,
  }),
  // Arriving with dates already on the URL (back from checkout, a shared link)
  // should show priced rooms immediately rather than after hydration.
  loader: async ({ context, params, deps }) => {
    const hotelId = Number(params.hotelId);
    await context.queryClient.ensureQueryData(publicHotelQueryOptions(hotelId));
    if (isValidStay(deps)) {
      // Prefetch only. Availability is a nice-to-have on this page, so a
      // failure degrades to the client query retrying rather than replacing
      // the whole page with an error boundary.
      await context.queryClient
        .ensureQueryData(
          hotelAvailabilityQueryOptions(hotelId, deps.checkIn, deps.checkOut),
        )
        .catch(() => undefined);
    }
  },
  component: HotelBookRoute,
});

function HotelBookRoute() {
  const { hotelId } = Route.useParams();
  return <HotelBookPage hotelId={Number(hotelId)} />;
}
