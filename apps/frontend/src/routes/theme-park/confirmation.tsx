import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ParkConfirmationPage } from "~/features/park-browsing/pages/park-confirmation-page";
import { myParkTicketsQueryOptions } from "~/features/park-browsing/queries";

const searchSchema = z.object({
  /** `PT-…` for a park ticket, `EB-…` for an event booking. */
  ref: z.string().optional(),
});

export const Route = createFileRoute("/theme-park/confirmation")({
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
    context.queryClient.ensureQueryData(myParkTicketsQueryOptions),
  component: ConfirmationRoute,
});

function ConfirmationRoute() {
  const { ref } = Route.useSearch();
  return <ParkConfirmationPage reference={ref} />;
}
