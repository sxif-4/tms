import { createFileRoute } from "@tanstack/react-router";
import { FerryManifestPage } from "~/features/ferry/pages/ferry-manifest-page";

export const Route = createFileRoute(
  "/dashboard/ferry/schedules/$scheduleId/manifest",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { scheduleId } = Route.useParams();
  return <FerryManifestPage scheduleId={Number(scheduleId)} />;
}
