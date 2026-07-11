import { createFileRoute } from "@tanstack/react-router";
import { FerryDashboardPage } from "~/features/ferry/pages/ferry-dashboard-page";

export const Route = createFileRoute("/dashboard/ferry/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <FerryDashboardPage />;
}
