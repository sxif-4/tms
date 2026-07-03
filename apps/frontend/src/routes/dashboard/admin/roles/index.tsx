import { createFileRoute } from "@tanstack/react-router";
import { RolesPage } from "~/features/users/pages/roles-page";
import { usersQueryOptions } from "~/features/users/queries";

export const Route = createFileRoute("/dashboard/admin/roles/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(usersQueryOptions),
  component: RolesPage,
});
