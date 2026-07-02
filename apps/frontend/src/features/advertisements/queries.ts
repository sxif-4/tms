import { queryOptions } from "@tanstack/react-query";
import { getAdvertisementsServerFn } from "./server";

/** Shared query for the advertisement list. Admin-only. */
export const advertisementsQueryOptions = queryOptions({
  queryKey: ["advertisements"] as const,
  queryFn: () => getAdvertisementsServerFn(),
  staleTime: 30 * 1000,
});
