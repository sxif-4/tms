import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { FerryBooking } from "./bookings-types";
import type {
  FerryBookingUser,
  FerryHotelBookingOption,
  FerryRoute,
  FerrySchedule,
} from "./types";

export const getFerryRoutesServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<FerryRoute[]> => {
    const res = await apiFetch("/ferry/routes");
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load ferry routes"));
    }

    return (await res.json()) as FerryRoute[];
  },
);

const createRouteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  origin: z.string().trim().min(1).max(100),
  destination: z.string().trim().min(1).max(100),
});

export const createFerryRouteServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createRouteSchema.parse(input))
  .handler(async ({ data }): Promise<FerryRoute> => {
    const res = await apiFetch("/ferry/routes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to create ferry route"));
    }

    return (await res.json()) as FerryRoute;
  });

const searchUsersSchema = z.object({
  q: z.string().trim().optional(),
});

export const searchFerryUsersServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => searchUsersSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBookingUser[]> => {
    const params = data.q ? `?q=${encodeURIComponent(data.q)}` : "";
    const res = await apiFetch(`/users/search${params}`);
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to search users"));
    }

    return (await res.json()) as FerryBookingUser[];
  });

const hotelBookingsForUserSchema = z.object({
  userId: z.number().int().positive(),
});

export const getHotelBookingsForUserServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => hotelBookingsForUserSchema.parse(input))
  .handler(async ({ data }): Promise<FerryHotelBookingOption[]> => {
    const res = await apiFetch(`/ferry/users/${data.userId}/hotel-bookings`);
    if (!res.ok) {
      throw new Error(
        await errorMessage(res, "Failed to load hotel bookings for this user"),
      );
    }

    return (await res.json()) as FerryHotelBookingOption[];
  });

const createScheduleSchema = z.object({
  routeId: z.number().int().positive(),
  departureAt: z.string().min(1),
  direction: z.enum(["to_theme_park", "to_island"]),
  capacity: z.number().int().positive(),
  basePrice: z.number().nonnegative(),
  status: z.enum(["scheduled", "departed", "cancelled"]),
});

export const getFerrySchedulesServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<FerrySchedule[]> => {
    const res = await apiFetch("/ferry/schedules");
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load ferry schedules"));
    }

    return (await res.json()) as FerrySchedule[];
  },
);

export const createFerryScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createScheduleSchema.parse(input))
  .handler(async ({ data }): Promise<FerrySchedule> => {
    const res = await apiFetch("/ferry/schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to create ferry schedule"));
    }

    return (await res.json()) as FerrySchedule;
  });

const createBookingSchema = z.object({
  userId: z.number().int().positive(),
  scheduleId: z.number().int().positive(),
  hotelBookingId: z.number().int().positive(),
  passengerCount: z.number().int().min(1).max(255),
  validatedBy: z.number().int().positive().optional(),
  validatedAt: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "validated"]),
});

export const getFerryBookingsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<FerryBooking[]> => {
    const res = await apiFetch("/ferry/bookings");
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load ferry bookings"));
    }

    return (await res.json()) as FerryBooking[];
  },
);

export const createFerryBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createBookingSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch("/ferry/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to create ferry booking"));
    }

    return (await res.json()) as FerryBooking;
  });
