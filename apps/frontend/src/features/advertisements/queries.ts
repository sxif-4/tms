import { queryOptions } from "@tanstack/react-query";
import {
  getActiveAdvertisementsServerFn,
  getAdvertisementsServerFn,
} from "./server";
import type { AdPlacement } from "./types";

/** Shared query for the advertisement list. Admin-only. */
export const advertisementsQueryOptions = queryOptions({
  queryKey: ["advertisements"] as const,
  queryFn: () => getAdvertisementsServerFn(),
  staleTime: 30 * 1000,
});

export const activeAdvertisementsQueryOptions = (
  placement: AdPlacement = "homepage",
) =>
  queryOptions({
    queryKey: ["advertisements", "active", placement] as const,
    queryFn: () => getActiveAdvertisementsServerFn({ data: { placement } }),
    staleTime: 60 * 1000,
  });
