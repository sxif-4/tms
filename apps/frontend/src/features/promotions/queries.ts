import { queryOptions } from "@tanstack/react-query";
import { getPromotionUsagesServerFn, getPromotionsServerFn } from "./server";
import type { PromotionTargetType } from "./types";

/**
 * Promotions the caller may manage (with targets). Pass `targetType` to narrow
 * to one domain — the park page passes `event`. The key keeps `"promotions"`
 * as its prefix so invalidating that prefix refreshes every variant.
 */
export const promotionsQueryOptions = (targetType?: PromotionTargetType) =>
  queryOptions({
    queryKey: ["promotions", targetType ?? "all"] as const,
    queryFn: () => getPromotionsServerFn({ data: { targetType } }),
    staleTime: 30 * 1000,
  });

/** Per-promotion usage list. */
export const promotionUsagesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["promotions", id, "usages"] as const,
    queryFn: () => getPromotionUsagesServerFn({ data: { id } }),
    staleTime: 30 * 1000,
  });
