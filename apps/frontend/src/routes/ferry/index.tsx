import { createFileRoute } from "@tanstack/react-router";
import { FerryLandingPage } from "~/features/ferry-browsing/pages/ferry-landing-page";

export const Route = createFileRoute("/ferry/")({
  component: FerryLandingPage,
});
