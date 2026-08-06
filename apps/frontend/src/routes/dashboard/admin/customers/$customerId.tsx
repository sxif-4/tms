import { createFileRoute } from "@tanstack/react-router";
import { CustomerDetailPage } from "~/features/customers/pages/customer-detail-page";
import { customerQueryOptions } from "~/features/customers/queries";

export const Route = createFileRoute("/dashboard/admin/customers/$customerId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      customerQueryOptions(Number(params.customerId)),
    ),
  component: CustomerDetailRoute,
});

function CustomerDetailRoute() {
  const { customerId } = Route.useParams();
  return <CustomerDetailPage customerId={Number(customerId)} />;
}
