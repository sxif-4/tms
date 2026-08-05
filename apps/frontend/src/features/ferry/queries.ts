import { queryOptions } from "@tanstack/react-query";
import type { FerryBookingStatus } from "./constants";
import {
  getFerryBookingsServerFn,
  getFerryPassServerFn,
  getFerryRoutesServerFn,
  getFerrySchedulesServerFn,
  getHotelBookingsForUserServerFn,
} from "./server";

export const ferryRoutesQueryOptions = queryOptions({
  queryKey: ["ferry", "routes"] as const,
  queryFn: () => getFerryRoutesServerFn(),
  staleTime: 30 * 1000,
});

export const ferrySchedulesQueryOptions = queryOptions({
  queryKey: ["ferry", "schedules"] as const,
  queryFn: () => getFerrySchedulesServerFn(),
  staleTime: 30 * 1000,
});

export type FerryBookingFilters = {
  status?: FerryBookingStatus;
  scheduleId?: number;
  routeId?: number;
  q?: string;
};

/**
 * Filtering happens server-side, so the filters are part of the cache key —
 * each combination is its own list rather than one list narrowed in the browser.
 */
export const ferryBookingsQueryOptions = (filters: FerryBookingFilters = {}) =>
  queryOptions({
    queryKey: ["ferry", "bookings", filters] as const,
    queryFn: () => getFerryBookingsServerFn({ data: filters }),
    staleTime: 30 * 1000,
  });

export const ferryPassQueryOptions = (bookingId: number | null) =>
  queryOptions({
    queryKey: ["ferry", "pass", bookingId] as const,
    queryFn: () => getFerryPassServerFn({ data: { id: bookingId! } }),
    enabled: bookingId != null,
    staleTime: 30 * 1000,
  });

export const ferryHotelBookingsForUserQueryOptions = (userId: number | null) =>
  queryOptions({
    queryKey: ["ferry", "hotel-bookings", userId] as const,
    queryFn: () =>
      getHotelBookingsForUserServerFn({ data: { userId: userId! } }),
    enabled: userId != null,
    staleTime: 30 * 1000,
  });
