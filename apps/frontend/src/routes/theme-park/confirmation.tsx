import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ParkDetailSkeleton } from "~/features/park-browsing/components/park-skeletons";
import { ParkConfirmationPage } from "~/features/park-browsing/pages/park-confirmation-page";
import {
  myEventBookingsQueryOptions,
  myParkTicketsQueryOptions,
} from "~/features/park-browsing/queries";

const searchSchema = z.object({
  /** `PT-…` for a park ticket, `EB-…` for an event booking. */
  ref: z.string().optional(),
});

export const Route = createFileRoute("/theme-park/confirmation")({
  validateSearch: searchSchema,
  pendingComponent: ParkDetailSkeleton,
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  loaderDeps: ({ search }) => ({ ref: search.ref }),
  // An `EB-` reference resolves against event bookings, a `PT-` one against
  // tickets. Warm whichever the reference points at, or the page renders its
  // "no longer available" fallback for a booking that was just made.
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(myParkTicketsQueryOptions),
      deps.ref?.startsWith("EB-")
        ? context.queryClient.ensureQueryData(myEventBookingsQueryOptions)
        : null,
    ]),
  component: ConfirmationRoute,
});

function ConfirmationRoute() {
  const { ref } = Route.useSearch();
  return <ParkConfirmationPage reference={ref} />;
}
