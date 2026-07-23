import { createFileRoute } from "@tanstack/react-router";
import { ParkGatePage } from "~/features/park/pages/park-gate-page";
import { parkTicketTypesQueryOptions } from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/gate/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(parkTicketTypesQueryOptions),
  component: ParkGatePage,
});
