import { createFileRoute } from "@tanstack/react-router";
import { AdminHotelsPage } from "~/features/hotels/pages/admin-hotels-page";
import { hotelsQueryOptions } from "~/features/hotels/queries";

export const Route = createFileRoute("/dashboard/admin/hotels/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(hotelsQueryOptions),
  component: AdminHotelsPage,
});
