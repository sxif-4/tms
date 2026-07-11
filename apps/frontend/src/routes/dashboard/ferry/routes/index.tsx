import { createFileRoute } from "@tanstack/react-router";
import { FerryRoutesPage } from "~/features/ferry/pages/ferry-routes-page";

export const Route = createFileRoute("/dashboard/ferry/routes/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <FerryRoutesPage />;
}
