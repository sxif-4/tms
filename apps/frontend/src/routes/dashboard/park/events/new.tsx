import { createFileRoute } from "@tanstack/react-router";
import { NewEventPage } from "~/features/park/pages/event-form-page";

export const Route = createFileRoute("/dashboard/park/events/new")({
  component: NewEventPage,
});
