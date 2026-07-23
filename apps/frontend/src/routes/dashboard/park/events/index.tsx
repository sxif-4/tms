import { createFileRoute } from "@tanstack/react-router";
import { ParkEventsPage } from "~/features/park/pages/park-events-page";
import { parkEventsQueryOptions } from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/events/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(parkEventsQueryOptions()),
  component: ParkEventsPage,
});
