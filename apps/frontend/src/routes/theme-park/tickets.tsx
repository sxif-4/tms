import { createFileRoute } from "@tanstack/react-router";
import { parkTicketsSearchSchema } from "~/features/park-browsing/constants";
import { ParkTicketsPage } from "~/features/park-browsing/pages/park-tickets-page";
import { publicTicketTypesQueryOptions } from "~/features/park-browsing/queries";

export const Route = createFileRoute("/theme-park/tickets")({
  validateSearch: parkTicketsSearchSchema,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(publicTicketTypesQueryOptions),
  component: ParkTicketsRoute,
});

function ParkTicketsRoute() {
  const { date } = Route.useSearch();
  return <ParkTicketsPage initialDate={date} />;
}
