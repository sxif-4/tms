import { createFileRoute } from "@tanstack/react-router";
import { FerryBookingsPage } from "~/features/ferry/pages/ferry-bookings-page";

export const Route = createFileRoute("/dashboard/ferry/bookings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <FerryBookingsPage />;
}
