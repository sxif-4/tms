import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FerryBookingsPage } from "~/features/ferry/pages/ferry-bookings-page";

const ferryBookingsSearchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/ferry/bookings/")({
  validateSearch: ferryBookingsSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { q } = Route.useSearch();
  return <FerryBookingsPage initialSearch={q} />;
}
