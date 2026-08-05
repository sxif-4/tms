import { createFileRoute } from "@tanstack/react-router";
import { EditEventPage } from "~/features/park/pages/event-form-page";
import { parkEventQueryOptions } from "~/features/park/queries";

export const Route = createFileRoute("/dashboard/park/events/$eventId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      parkEventQueryOptions(Number(params.eventId)),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  return <EditEventPage eventId={Number(eventId)} />;
}
