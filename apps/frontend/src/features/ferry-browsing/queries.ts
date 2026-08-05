import { queryOptions } from "@tanstack/react-query";
import {
  getBookableSailingsServerFn,
  getMyEligibleStaysServerFn,
  getMyFerryBookingsServerFn,
  getMyFerryPassServerFn,
} from "./server";

export const bookableSailingsQueryOptions = (
  filters: { direction?: "to_theme_park" | "to_island"; routeId?: number } = {},
) =>
  queryOptions({
    queryKey: ["ferry-browsing", "sailings", filters] as const,
    queryFn: () => getBookableSailingsServerFn({ data: filters }),
    staleTime: 30 * 1000,
  });

export const myEligibleStaysQueryOptions = queryOptions({
  queryKey: ["ferry-browsing", "stays"] as const,
  queryFn: () => getMyEligibleStaysServerFn(),
  staleTime: 30 * 1000,
});

export const myFerryBookingsQueryOptions = queryOptions({
  queryKey: ["ferry-browsing", "my-bookings"] as const,
  queryFn: () => getMyFerryBookingsServerFn(),
  staleTime: 30 * 1000,
});

export const myFerryPassQueryOptions = (bookingId: number | null) =>
  queryOptions({
    queryKey: ["ferry-browsing", "pass", bookingId] as const,
    queryFn: () => getMyFerryPassServerFn({ data: { id: bookingId! } }),
    enabled: bookingId != null,
    staleTime: 30 * 1000,
  });
