import { createFileRoute } from "@tanstack/react-router";
import { FerrySchedulesPage } from "~/features/ferry/pages/ferry-schedules-page";

export const Route = createFileRoute("/dashboard/ferry/schedules/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <FerrySchedulesPage />;
}
