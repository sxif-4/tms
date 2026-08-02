import { queryOptions } from "@tanstack/react-query";
import { getUserHotelsServerFn, getUsersServerFn } from "./server";

/** Shared query for the full user list. Admin-only. */
export const usersQueryOptions = queryOptions({
  queryKey: ["users"] as const,
  queryFn: () => getUsersServerFn(),
  staleTime: 30 * 1000,
});

/** Hotels one staff member is scoped to. Admin-only. */
export const userHotelsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ["user-hotels", userId] as const,
    queryFn: () => getUserHotelsServerFn({ data: { userId } }),
    staleTime: 30 * 1000,
  });
