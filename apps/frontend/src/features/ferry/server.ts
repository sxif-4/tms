import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { FerryBooking, FerryPass } from "./bookings-types";
import type {
  FerryBookingUser,
  FerryHotelBookingOption,
  FerryRoute,
  FerrySchedule,
} from "./types";

/** Drops undefined/empty params so we never send `?status=undefined`. */
function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

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

export const updateFerryRouteServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    createRouteSchema.extend({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<FerryRoute> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/ferry/routes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to update ferry route"));
    }

    return (await res.json()) as FerryRoute;
  });

const idSchema = z.object({ id: z.number().int().positive() });

export const deleteFerryRouteServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/ferry/routes/${data.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to delete ferry route"));
    }
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

export const getFerrySchedulesServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<FerrySchedule[]> => {
  const res = await apiFetch("/ferry/schedules");
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to load ferry schedules"));
  }

  return (await res.json()) as FerrySchedule[];
});

export const createFerryScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createScheduleSchema.parse(input))
  .handler(async ({ data }): Promise<FerrySchedule> => {
    const res = await apiFetch("/ferry/schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(
        await errorMessage(res, "Failed to create ferry schedule"),
      );
    }

    return (await res.json()) as FerrySchedule;
  });

export const updateFerryScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    createScheduleSchema
      .partial()
      .extend({ id: z.number().int().positive() })
      .parse(input),
  )
  .handler(async ({ data }): Promise<FerrySchedule> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/ferry/schedules/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        await errorMessage(res, "Failed to update ferry schedule"),
      );
    }

    return (await res.json()) as FerrySchedule;
  });

export const deleteFerryScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/ferry/schedules/${data.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(
        await errorMessage(res, "Failed to delete ferry schedule"),
      );
    }
  });

// status, validatedBy and validatedAt are server-controlled — a new booking is
// always `pending`, and only the issue/validate actions move it from there.
const createBookingSchema = z.object({
  userId: z.number().int().positive(),
  scheduleId: z.number().int().positive(),
  hotelBookingId: z.number().int().positive(),
  passengerCount: z.number().int().min(1).max(255),
});

const bookingFiltersSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "validated"]).optional(),
  scheduleId: z.number().int().positive().optional(),
  routeId: z.number().int().positive().optional(),
  q: z.string().trim().optional(),
});

export const getFerryBookingsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => bookingFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<FerryBooking[]> => {
    const res = await apiFetch(`/ferry/bookings${qs(data)}`);
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load ferry bookings"));
    }

    return (await res.json()) as FerryBooking[];
  });

const bookingIdSchema = z.object({ id: z.number().int().positive() });

/** Issues the ferry pass — pending → confirmed, and takes the fare. */
export const issueFerryPassServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => bookingIdSchema.parse(input))
  .handler(async ({ data }): Promise<FerryPass> => {
    const res = await apiFetch(`/ferry/bookings/${data.id}/issue`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to issue ferry pass"));
    }

    return (await res.json()) as FerryPass;
  });

export const getFerryPassServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => bookingIdSchema.parse(input))
  .handler(async ({ data }): Promise<FerryPass> => {
    const res = await apiFetch(`/ferry/bookings/${data.id}/pass`);
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load ferry pass"));
    }

    return (await res.json()) as FerryPass;
  });

export const cancelFerryBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => bookingIdSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch(`/ferry/bookings/${data.id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to cancel booking"));
    }

    return (await res.json()) as FerryBooking;
  });

const referenceSchema = z.object({
  bookingReference: z.string().trim().min(1).max(20),
});

/** Read-only preview for the boarding screen — deliberately does not mutate. */
export const lookupFerryBookingServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => referenceSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch(
      `/ferry/bookings/lookup/${encodeURIComponent(data.bookingReference)}`,
    );
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to look up booking"));
    }

    return (await res.json()) as FerryBooking;
  });

export const validateFerryPassServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => referenceSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch("/ferry/bookings/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to board passenger"));
    }

    return (await res.json()) as FerryBooking;
  });

export const createFerryBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createBookingSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch("/ferry/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(
        await errorMessage(res, "Failed to create ferry booking"),
      );
    }

    return (await res.json()) as FerryBooking;
  });
