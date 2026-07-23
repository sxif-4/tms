import { createFileRoute } from "@tanstack/react-router";
import { ParkAvailabilityPage } from "~/features/park/pages/park-availability-page";

// The month grid picks its own range client-side, so there's nothing stable to
// preload here — the page's suspense query fetches on mount.
export const Route = createFileRoute("/dashboard/park/availability/")({
  component: ParkAvailabilityPage,
});
