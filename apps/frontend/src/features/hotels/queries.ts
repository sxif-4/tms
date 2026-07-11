import { queryOptions } from "@tanstack/react-query";
import {
  getHotelBookingsServerFn,
  getHotelDashboardServerFn,
  getHotelOccupancyServerFn,
  getHotelRevenueServerFn,
  getHotelsServerFn,
  getRoomsServerFn,
  getRoomTypesServerFn,
} from "./server";

/** Hotels the caller is scoped to — typically just one for hotel_staff. */
export const hotelsQueryOptions = queryOptions({
  queryKey: ["hotels"] as const,
  queryFn: () => getHotelsServerFn(),
  staleTime: 30 * 1000,
});

/** Global room-type catalog. */
export const roomTypesQueryOptions = queryOptions({
  queryKey: ["room-types"] as const,
  queryFn: () => getRoomTypesServerFn(),
  staleTime: 30 * 1000,
});

export const hotelRoomsQueryOptions = (hotelId: number) =>
  queryOptions({
    queryKey: ["hotel-rooms", hotelId] as const,
    queryFn: () => getRoomsServerFn({ data: { hotelId } }),
    staleTime: 15 * 1000,
  });

export const hotelBookingsQueryOptions = (hotelId: number, status?: string) =>
  queryOptions({
    queryKey: ["hotel-bookings", hotelId, status] as const,
    queryFn: () => getHotelBookingsServerFn({ data: { hotelId, status } }),
    staleTime: 15 * 1000,
  });

export const hotelDashboardQueryOptions = (hotelId: number) =>
  queryOptions({
    queryKey: ["hotel-dashboard", hotelId] as const,
    queryFn: () => getHotelDashboardServerFn({ data: { hotelId } }),
    staleTime: 15 * 1000,
  });

export const hotelRevenueQueryOptions = (
  hotelId: number,
  from?: string,
  to?: string,
) =>
  queryOptions({
    queryKey: ["hotel-revenue", hotelId, from, to] as const,
    queryFn: () => getHotelRevenueServerFn({ data: { hotelId, from, to } }),
    staleTime: 30 * 1000,
  });

export const hotelOccupancyQueryOptions = (
  hotelId: number,
  from?: string,
  to?: string,
) =>
  queryOptions({
    queryKey: ["hotel-occupancy", hotelId, from, to] as const,
    queryFn: () => getHotelOccupancyServerFn({ data: { hotelId, from, to } }),
    staleTime: 30 * 1000,
  });
