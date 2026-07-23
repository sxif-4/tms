import { createFileRoute } from "@tanstack/react-router";
import { ParkTicketsPage } from "~/features/park/pages/park-tickets-page";
import {
  parkTicketsQueryOptions,
  parkTicketTypesQueryOptions,
} from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/tickets/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(parkTicketTypesQueryOptions),
      context.queryClient.ensureQueryData(parkTicketsQueryOptions()),
    ]);
  },
  component: ParkTicketsPage,
});
