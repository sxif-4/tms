import { createFileRoute } from "@tanstack/react-router";
import { FerryReportsPage } from "~/features/ferry/pages/ferry-reports-page";

export const Route = createFileRoute("/dashboard/ferry/reports/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <FerryReportsPage />;
}
