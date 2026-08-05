import { createFileRoute } from "@tanstack/react-router";
import { FerryValidationPage } from "~/features/ferry/pages/ferry-validation-page";

export const Route = createFileRoute("/dashboard/ferry/validate/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <FerryValidationPage />;
}
