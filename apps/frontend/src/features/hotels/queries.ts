import { queryOptions } from "@tanstack/react-query";
import {
  getHotelBookingsServerFn,
  getHotelDashboardServerFn,
  getHotelOccupancyServerFn,
  getHotelRevenueServerFn,
  getHotelsServerFn,
  getRoomsServerFn,
  getRoomTypeServerFn,
  getRoomTypesServerFn,
} from "./server";

/** Hotels the caller is scoped to — typically just one for hotel_staff. */
export const hotelsQueryOptions = queryOptions({
  queryKey: ["hotels"] as const,
  queryFn: () => getHotelsServerFn(),
  staleTime: 30 * 1000,
});

/** One hotel's room types. */
export const roomTypesQueryOptions = (hotelId: number) =>
  queryOptions({
    queryKey: ["room-types", hotelId] as const,
    queryFn: () => getRoomTypesServerFn({ data: { hotelId } }),
    staleTime: 30 * 1000,
  });

/** A single room type — lets the edit page load from the id in the URL. */
export const roomTypeQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["room-type", id] as const,
    queryFn: () => getRoomTypeServerFn({ data: { id } }),
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
