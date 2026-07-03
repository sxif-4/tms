import { queryOptions } from "@tanstack/react-query";
import { getMapLocationsServerFn } from "./server";

/** Shared query for the map location list. Admin-only. */
export const mapLocationsQueryOptions = queryOptions({
  queryKey: ["map-locations"] as const,
  queryFn: () => getMapLocationsServerFn(),
  staleTime: 30 * 1000,
});
