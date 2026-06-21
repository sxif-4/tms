import { createFileRoute } from "@tanstack/react-router";
import { UsersListPage } from "~/features/users/pages/users-list-page";
import { usersQueryOptions } from "~/features/users/queries";

export const Route = createFileRoute("/dashboard/admin/users/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(usersQueryOptions),
  component: UsersListPage,
});
