import { queryOptions } from "@tanstack/react-query";
import { getUsersServerFn } from "./server";

/** Shared query for the full user list. Admin-only. */
export const usersQueryOptions = queryOptions({
  queryKey: ["users"] as const,
  queryFn: () => getUsersServerFn(),
  staleTime: 30 * 1000,
});
