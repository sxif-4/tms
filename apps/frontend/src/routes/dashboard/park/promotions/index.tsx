import { createFileRoute } from "@tanstack/react-router";
import { ParkPromotionsPage } from "~/features/park/pages/park-promotions-page";
import { promotionsQueryOptions } from "~/features/promotions/queries";

export const Route = createFileRoute("/dashboard/park/promotions/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(promotionsQueryOptions("event")),
  component: ParkPromotionsPage,
});
