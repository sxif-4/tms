import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  createHotelBookingServerFn,
  getAvailabilityCalendarServerFn,
  getHotelAvailabilityServerFn,
  getMyHotelBookingsServerFn,
  getPublicHotelServerFn,
  getPublicHotelsServerFn,
} from "./server";
import type { HotelFilters } from "./types";

/** Shared query for the visitor hotel browse list, filtered by URL search params. */
export const publicHotelsQueryOptions = (filters: HotelFilters = {}) =>
  queryOptions({
    queryKey: ["public-hotels", filters] as const,
    queryFn: () => getPublicHotelsServerFn({ data: filters }),
    staleTime: 30 * 1000,
  });

export const publicHotelQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["public-hotels", id] as const,
    queryFn: () => getPublicHotelServerFn({ data: { id } }),
    staleTime: 30 * 1000,
  });

export const hotelAvailabilityQueryOptions = (
  id: number,
  checkIn: string,
  checkOut: string,
) =>
  queryOptions({
    queryKey: ["public-hotels", id, "availability", checkIn, checkOut] as const,
    queryFn: () => getHotelAvailabilityServerFn({ data: { id, checkIn, checkOut } }),
    enabled: Boolean(checkIn && checkOut),
    staleTime: 15 * 1000,
  });

export const availabilityCalendarQueryOptions = (
  id: number,
  from?: string,
  to?: string,
  roomTypeId?: number,
) =>
  queryOptions({
    queryKey: ["public-hotels", id, "calendar", from, to, roomTypeId] as const,
    queryFn: () =>
      getAvailabilityCalendarServerFn({ data: { id, from, to, roomTypeId } }),
    staleTime: 60 * 1000,
  });

/** The visitor's own booking history — requires auth on the API. */
export const myHotelBookingsQueryOptions = queryOptions({
  queryKey: ["hotel-bookings", "mine"] as const,
  queryFn: () => getMyHotelBookingsServerFn(),
  staleTime: 10 * 1000,
});

export const createHotelBookingMutationOptions = () =>
  mutationOptions({
    mutationFn: (input: {
      hotelId: number;
      roomTypeId: number;
      checkIn: string;
      checkOut: string;
      guests: number;
    }) => createHotelBookingServerFn({ data: input }),
  });
