import { queryOptions } from "@tanstack/react-query";
import {
  getFerryBookingsServerFn,
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

export const ferryBookingsQueryOptions = queryOptions({
  queryKey: ["ferry", "bookings"] as const,
  queryFn: () => getFerryBookingsServerFn(),
  staleTime: 30 * 1000,
});

export const ferryHotelBookingsForUserQueryOptions = (userId: number | null) =>
  queryOptions({
    queryKey: ["ferry", "hotel-bookings", userId] as const,
    queryFn: () => getHotelBookingsForUserServerFn({ data: { userId: userId! } }),
    enabled: userId != null,
    staleTime: 30 * 1000,
  });
