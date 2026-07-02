import { createFileRoute } from "@tanstack/react-router";
import { AdvertisementsPage } from "~/features/advertisements/pages/advertisements-page";
import { advertisementsQueryOptions } from "~/features/advertisements/queries";

export const Route = createFileRoute("/dashboard/admin/ads/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(advertisementsQueryOptions),
  component: AdvertisementsPage,
});
