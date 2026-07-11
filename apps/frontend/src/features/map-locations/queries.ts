import { queryOptions } from "@tanstack/react-query";
import { getMapLocationsServerFn, getPublicHotelPinsServerFn } from "./server";

/** Shared query for the map location list. Public — used by admin + visitors. */
export const mapLocationsQueryOptions = queryOptions({
  queryKey: ["map-locations"] as const,
  queryFn: () => getMapLocationsServerFn(),
  staleTime: 30 * 1000,
});

/** Hotel id + position lookup, for linking hotel-type pins to `/hotels/$hotelId`. */
export const publicHotelPinsQueryOptions = queryOptions({
  queryKey: ["public-hotel-pins"] as const,
  queryFn: () => getPublicHotelPinsServerFn(),
  staleTime: 30 * 1000,
});
