import { queryOptions } from "@tanstack/react-query";
import type { FerryBookingStatus } from "./constants";
import {
  getFerryBookingsServerFn,
  getFerryDashboardServerFn,
  getFerryManifestServerFn,
  getFerryPassServerFn,
  getFerryRoutesReportServerFn,
  getFerryRoutesServerFn,
  getFerrySalesReportServerFn,
  getFerrySchedulesServerFn,
  getFerryTripsReportServerFn,
  getHotelBookingsForUserServerFn,
} from "./server";

export type FerryReportRange = {
  from?: string;
  to?: string;
};

export const ferrySalesReportQueryOptions = (
  range: FerryReportRange & { groupBy?: "day" | "week" | "month" },
) =>
  queryOptions({
    queryKey: ["ferry", "reports", "sales", range] as const,
    queryFn: () => getFerrySalesReportServerFn({ data: range }),
    staleTime: 60 * 1000,
  });

export const ferryTripsReportQueryOptions = (
  range: FerryReportRange & { routeId?: number },
) =>
  queryOptions({
    queryKey: ["ferry", "reports", "trips", range] as const,
    queryFn: () => getFerryTripsReportServerFn({ data: range }),
    staleTime: 60 * 1000,
  });

export const ferryRoutesReportQueryOptions = (range: FerryReportRange) =>
  queryOptions({
    queryKey: ["ferry", "reports", "routes", range] as const,
    queryFn: () => getFerryRoutesReportServerFn({ data: range }),
    staleTime: 60 * 1000,
  });

export const ferryManifestQueryOptions = (scheduleId: number) =>
  queryOptions({
    queryKey: ["ferry", "manifest", scheduleId] as const,
    queryFn: () => getFerryManifestServerFn({ data: { scheduleId } }),
    staleTime: 15 * 1000,
  });

export const ferryDashboardQueryOptions = queryOptions({
  queryKey: ["ferry", "dashboard"] as const,
  queryFn: () => getFerryDashboardServerFn(),
  staleTime: 30 * 1000,
});

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
