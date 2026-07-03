import { queryOptions } from "@tanstack/react-query";
import {
  getOverviewServerFn,
  getSalesServerFn,
  getUsageServerFn,
} from "./server";

export const overviewQueryOptions = queryOptions({
  queryKey: ["reports", "overview"] as const,
  queryFn: () => getOverviewServerFn(),
  staleTime: 60 * 1000,
});

export const salesQueryOptions = queryOptions({
  queryKey: ["reports", "sales"] as const,
  queryFn: () => getSalesServerFn(),
  staleTime: 60 * 1000,
});

export const usageQueryOptions = queryOptions({
  queryKey: ["reports", "usage"] as const,
  queryFn: () => getUsageServerFn(),
  staleTime: 60 * 1000,
});
