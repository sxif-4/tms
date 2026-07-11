import { createFileRoute } from "@tanstack/react-router";
import { activeAdvertisementsQueryOptions } from "~/features/advertisements/queries";
import { HomePage } from "~/features/hotel-browsing/pages/home-page";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publicHotelsQueryOptions()),
      context.queryClient.ensureQueryData(
        activeAdvertisementsQueryOptions("homepage"),
      ),
    ]),
  component: HomePage,
});
