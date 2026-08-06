import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "~/features/customers/pages/customers-page";
import { customerSearchQueryOptions } from "~/features/customers/queries";

export const Route = createFileRoute("/dashboard/admin/customers/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(customerSearchQueryOptions()),
  component: CustomersPage,
});
