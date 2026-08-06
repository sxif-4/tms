import { queryOptions } from "@tanstack/react-query";
import {
  getOccupancyServerFn,
  getOperationsServerFn,
  getOverviewServerFn,
  getSalesServerFn,
  getScheduleFillServerFn,
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

/** Shorter stale time than the rest — these drive "act on it now" tiles. */
export const operationsQueryOptions = queryOptions({
  queryKey: ["reports", "operations"] as const,
  queryFn: () => getOperationsServerFn(),
  staleTime: 15 * 1000,
});

export const occupancyQueryOptions = queryOptions({
  queryKey: ["reports", "occupancy"] as const,
  queryFn: () => getOccupancyServerFn(),
  staleTime: 60 * 1000,
});

export const scheduleFillQueryOptions = queryOptions({
  queryKey: ["reports", "schedule-fill"] as const,
  queryFn: () => getScheduleFillServerFn(),
  staleTime: 60 * 1000,
});
