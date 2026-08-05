import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ParkDetailSkeleton } from "~/features/park-browsing/components/park-skeletons";
import { ParkEventDetailPage } from "~/features/park-browsing/pages/park-event-detail-page";
import {
  myParkTicketsQueryOptions,
  publicParkEventQueryOptions,
} from "~/features/park-browsing/queries";

const searchSchema = z.object({
  /** `yyyy-MM-dd` the visitor already holds a ticket for, carried from browse. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const Route = createFileRoute("/theme-park/events/$eventId")({
  validateSearch: searchSchema,
  pendingComponent: ParkDetailSkeleton,
  /**
   * A signed-in visitor's tickets decide whether the booking box is usable, so
   * they must be warm before first paint. Without this, SSR renders "you need a
   * park ticket" to someone holding one — pushing them to buy a duplicate.
   */
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        publicParkEventQueryOptions(Number(params.eventId)),
      ),
      context.user
        ? context.queryClient.ensureQueryData(myParkTicketsQueryOptions)
        : null,
    ]),
  component: ParkEventDetailRoute,
});

function ParkEventDetailRoute() {
  const { eventId } = Route.useParams();
  const { date } = Route.useSearch();
  return <ParkEventDetailPage eventId={Number(eventId)} plannedDate={date} />;
}
