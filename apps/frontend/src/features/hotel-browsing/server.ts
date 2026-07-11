import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type {
  DayAvailability,
  HotelBooking,
  HotelDetail,
  HotelSummary,
  RoomTypeAvailability,
} from "./types";

const hotelFiltersSchema = z.object({
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  guests: z.number().optional(),
});

const idSchema = z.object({ id: z.number().int().positive() });

const availabilitySchema = z.object({
  id: z.number().int().positive(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
});

const calendarSchema = z.object({
  id: z.number().int().positive(),
  from: z.string().optional(),
  to: z.string().optional(),
  roomTypeId: z.number().int().positive().optional(),
});

const createBookingSchema = z.object({
  hotelId: z.number().int().positive(),
  roomTypeId: z.number().int().positive(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1).max(20),
});

/** Public visitor hotel browsing — unauthenticated on the API, no staff scoping. */
export const getPublicHotelsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => hotelFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<HotelSummary[]> => {
    const params = new URLSearchParams();
    if (data.minPrice != null) params.set("minPrice", String(data.minPrice));
    if (data.maxPrice != null) params.set("maxPrice", String(data.maxPrice));
    if (data.guests != null) params.set("guests", String(data.guests));
    const qs = params.toString();
    const res = await apiFetch(`/public/hotels${qs ? `?${qs}` : ""}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load hotels"));
    return (await res.json()) as HotelSummary[];
  });

export const getPublicHotelServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<HotelDetail> => {
    const res = await apiFetch(`/public/hotels/${data.id}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load hotel"));
    return (await res.json()) as HotelDetail;
  });

export const getHotelAvailabilityServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => availabilitySchema.parse(input))
  .handler(async ({ data }): Promise<RoomTypeAvailability[]> => {
    const params = new URLSearchParams({
      checkIn: data.checkIn,
      checkOut: data.checkOut,
    });
    const res = await apiFetch(
      `/public/hotels/${data.id}/availability?${params.toString()}`,
    );
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load availability"));
    return (await res.json()) as RoomTypeAvailability[];
  });

export const getAvailabilityCalendarServerFn = createServerFn({
  method: "GET",
})
  .validator((input: unknown) => calendarSchema.parse(input))
  .handler(async ({ data }): Promise<DayAvailability[]> => {
    const params = new URLSearchParams();
    if (data.from) params.set("from", data.from);
    if (data.to) params.set("to", data.to);
    if (data.roomTypeId != null)
      params.set("roomTypeId", String(data.roomTypeId));
    const qs = params.toString();
    const res = await apiFetch(
      `/public/hotels/${data.id}/availability-calendar${qs ? `?${qs}` : ""}`,
    );
    if (!res.ok)
      throw new Error(
        await errorMessage(res, "Failed to load the availability calendar"),
      );
    return (await res.json()) as DayAvailability[];
  });

/** Requires auth — the caller is taken from the JWT, not the body. */
export const createHotelBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createBookingSchema.parse(input))
  .handler(async ({ data }): Promise<HotelBooking> => {
    const res = await apiFetch("/hotel-bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create booking"));
    return (await res.json()) as HotelBooking;
  });

/** Requires auth — returns only the caller's own bookings. */
export const getMyHotelBookingsServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<HotelBooking[]> => {
  const res = await apiFetch("/hotel-bookings/mine");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load your bookings"));
  return (await res.json()) as HotelBooking[];
});
