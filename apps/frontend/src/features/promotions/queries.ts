import { queryOptions } from "@tanstack/react-query";
import { getPromotionUsagesServerFn, getPromotionsServerFn } from "./server";

/** Shared query for the promotion list (with targets). Admin-only. */
export const promotionsQueryOptions = queryOptions({
  queryKey: ["promotions"] as const,
  queryFn: () => getPromotionsServerFn(),
  staleTime: 30 * 1000,
});

/** Per-promotion usage list. */
export const promotionUsagesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["promotions", id, "usages"] as const,
    queryFn: () => getPromotionUsagesServerFn({ data: { id } }),
    staleTime: 30 * 1000,
  });
