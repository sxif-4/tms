import { createFileRoute } from "@tanstack/react-router";
import { PromotionsPage } from "~/features/promotions/pages/promotions-page";
import { promotionsQueryOptions } from "~/features/promotions/queries";

export const Route = createFileRoute("/dashboard/admin/promotions/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(promotionsQueryOptions),
  component: PromotionsPage,
});
