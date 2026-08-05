import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  bookingDraftSchema,
  isCompleteDraft,
  isValidStay,
} from "~/features/hotel-browsing/booking-draft";
import { HotelCheckoutPage } from "~/features/hotel-browsing/pages/hotel-checkout-page";
import {
  hotelAvailabilityQueryOptions,
  publicHotelQueryOptions,
} from "~/features/hotel-browsing/queries";

/**
 * Step 2 of the funnel: paying, so the site nav comes off and sign-in is
 * required. Because the draft rides in the search params, `location.href`
 * round-trips the whole booking through /login without any stored state.
 */
export const Route = createFileRoute("/hotels/$hotelId/checkout")({
  validateSearch: bookingDraftSchema,
  staticData: { chrome: "minimal" },
  beforeLoad: ({ context, location, params, search }) => {
    // Auth first: the redirect has to capture the URL while it still has the draft on it.
    if (!context.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    // A half-filled draft can't be priced or booked — send them back to finish it.
    if (!isCompleteDraft(search)) {
      throw redirect({
        to: "/hotels/$hotelId/book",
        params: { hotelId: params.hotelId },
        search,
      });
    }
  },
  loaderDeps: ({ search }) => ({
    checkIn: search.checkIn,
    checkOut: search.checkOut,
  }),
  /*
   * Availability is prefetched rather than left to a client `useQuery`: on a
   * page whose whole job is "here is what you are about to pay", the total has
   * to be in the server-rendered HTML, not flash in after hydration.
   */
  loader: async ({ context, params, deps }) => {
    const hotelId = Number(params.hotelId);
    await context.queryClient.ensureQueryData(publicHotelQueryOptions(hotelId));
    if (isValidStay(deps)) {
      await context.queryClient
        .ensureQueryData(
          hotelAvailabilityQueryOptions(hotelId, deps.checkIn, deps.checkOut),
        )
        .catch(() => undefined);
    }
  },
  component: HotelCheckoutRoute,
});

function HotelCheckoutRoute() {
  const { hotelId } = Route.useParams();
  const search = Route.useSearch();
  // `beforeLoad` already redirected incomplete drafts; this is the type narrowing.
  if (!isCompleteDraft(search)) return null;
  return <HotelCheckoutPage hotelId={Number(hotelId)} draft={search} />;
}
