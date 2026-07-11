import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type {
  Hotel,
  HotelBooking,
  HotelDashboardResponse,
  OccupancyPoint,
  RevenuePoint,
  Room,
  RoomType,
} from "./types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;
const ROOM_STATUS_VALUES = [
  "available",
  "occupied",
  "maintenance",
  "out_of_service",
] as const;
const STAFF_SETTABLE_STATUSES = ["confirmed", "cancelled", "completed"] as const;

/** Lists hotels the caller is scoped to (admin sees all, hotel_staff sees their assignments). */
export const getHotelsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Hotel[]> => {
    const res = await apiFetch("/hotels");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load hotels"));
    return (await res.json()) as Hotel[];
  },
);

/** Global room-type catalog. */
export const getRoomTypesServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RoomType[]> => {
    const res = await apiFetch("/room-types");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load room types"));
    return (await res.json()) as RoomType[];
  },
);

const roomTypeInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  basePricePerNight: z.string().regex(DECIMAL),
  maxOccupancy: z.number().int().min(1).max(20),
});

export const createRoomTypeServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => roomTypeInputSchema.parse(input))
  .handler(async ({ data }): Promise<RoomType> => {
    const res = await apiFetch("/room-types", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create room type"));
    return (await res.json()) as RoomType;
  });

export const updateRoomTypeServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    roomTypeInputSchema.extend({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<RoomType> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/room-types/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update room type"));
    return (await res.json()) as RoomType;
  });

export const deleteRoomTypeServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/room-types/${data.id}`, { method: "DELETE" });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete room type"));
  });

export const getRoomsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ hotelId: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<Room[]> => {
    const res = await apiFetch(`/rooms?hotelId=${data.hotelId}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load rooms"));
    return (await res.json()) as Room[];
  });

const roomInputSchema = z.object({
  hotelId: z.number().int().positive(),
  roomTypeId: z.number().int().positive(),
  roomNumber: z.string().trim().min(1).max(50),
  status: z.enum(ROOM_STATUS_VALUES).optional(),
});

export const createRoomServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => roomInputSchema.parse(input))
  .handler(async ({ data }): Promise<Room> => {
    const res = await apiFetch("/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create room"));
    return (await res.json()) as Room;
  });

export const updateRoomServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        roomTypeId: z.number().int().positive().optional(),
        roomNumber: z.string().trim().min(1).max(50).optional(),
        status: z.enum(ROOM_STATUS_VALUES).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Room> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/rooms/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update room"));
    return (await res.json()) as Room;
  });

export const deleteRoomServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.number() }).parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/rooms/${data.id}`, { method: "DELETE" });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete room"));
  });

export const getHotelBookingsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        hotelId: z.number().int().positive(),
        status: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<HotelBooking[]> => {
    const params = new URLSearchParams({ hotelId: String(data.hotelId) });
    if (data.status) params.set("status", data.status);
    const res = await apiFetch(`/hotel-bookings?${params.toString()}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load bookings"));
    return (await res.json()) as HotelBooking[];
  });

export const assignRoomServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        roomId: z.number().int().positive(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<HotelBooking> => {
    const res = await apiFetch(`/hotel-bookings/${data.id}/assign-room`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId: data.roomId }),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to assign room"));
    return (await res.json()) as HotelBooking;
  });

export const updateBookingStatusServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        status: z.enum(STAFF_SETTABLE_STATUSES),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<HotelBooking> => {
    const res = await apiFetch(`/hotel-bookings/${data.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });
    if (!res.ok)
      throw new Error(
        await errorMessage(res, "Failed to update booking status"),
      );
    return (await res.json()) as HotelBooking;
  });

export const getHotelDashboardServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ hotelId: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<HotelDashboardResponse> => {
    const res = await apiFetch(`/hotel-dashboard?hotelId=${data.hotelId}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load dashboard"));
    return (await res.json()) as HotelDashboardResponse;
  });

const reportsInputSchema = z.object({
  hotelId: z.number().int().positive(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const getHotelRevenueServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => reportsInputSchema.parse(input))
  .handler(async ({ data }): Promise<RevenuePoint[]> => {
    const params = new URLSearchParams({ hotelId: String(data.hotelId) });
    if (data.from) params.set("from", data.from);
    if (data.to) params.set("to", data.to);
    const res = await apiFetch(`/hotel-reports/revenue?${params.toString()}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load revenue report"));
    return (await res.json()) as RevenuePoint[];
  });

export const getHotelOccupancyServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => reportsInputSchema.parse(input))
  .handler(async ({ data }): Promise<OccupancyPoint[]> => {
    const params = new URLSearchParams({ hotelId: String(data.hotelId) });
    if (data.from) params.set("from", data.from);
    if (data.to) params.set("to", data.to);
    const res = await apiFetch(
      `/hotel-reports/occupancy?${params.toString()}`,
    );
    if (!res.ok)
      throw new Error(
        await errorMessage(res, "Failed to load occupancy report"),
      );
    return (await res.json()) as OccupancyPoint[];
  });
