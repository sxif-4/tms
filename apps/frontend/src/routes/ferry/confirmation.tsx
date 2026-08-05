import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FerryConfirmationPage } from "~/features/ferry-browsing/pages/ferry-confirmation-page";

const searchSchema = z.object({ reference: z.string().optional() });

export const Route = createFileRoute("/ferry/confirmation")({
  validateSearch: searchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { reference } = Route.useSearch();
  return <FerryConfirmationPage reference={reference} />;
}
