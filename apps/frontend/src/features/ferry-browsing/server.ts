import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { FerryBooking, FerryPass } from "~/features/ferry/bookings-types";
import type { BookableSailing, EligibleStay } from "./types";

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

const sailingFiltersSchema = z.object({
  routeId: z.number().int().positive().optional(),
  direction: z.enum(["to_theme_park", "to_island"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Only sailings a visitor can actually book — filtered server-side. */
export const getBookableSailingsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => sailingFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<BookableSailing[]> => {
    const res = await apiFetch(`/ferry/schedules/bookable${qs(data)}`);
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load sailings"));
    }

    return (await res.json()) as BookableSailing[];
  });

export const getMyEligibleStaysServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<EligibleStay[]> => {
  const res = await apiFetch("/ferry/my-hotel-bookings");
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to load your stays"));
  }

  return (await res.json()) as EligibleStay[];
});

export const getMyFerryBookingsServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<FerryBooking[]> => {
  const res = await apiFetch("/ferry/bookings/mine");
  if (!res.ok) {
    throw new Error(await errorMessage(res, "Failed to load your ferry trips"));
  }

  return (await res.json()) as FerryBooking[];
});

const bookSchema = z.object({
  scheduleId: z.number().int().positive(),
  hotelBookingId: z.number().int().positive(),
  passengerCount: z.number().int().min(1).max(255),
});

/** No `userId` — the API takes the passenger from the session. */
export const bookFerryServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => bookSchema.parse(input))
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch("/ferry/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to reserve your seat"));
    }

    return (await res.json()) as FerryBooking;
  });

export const getMyFerryPassServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<FerryPass> => {
    const res = await apiFetch(`/ferry/bookings/${data.id}/pass`);
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to load your pass"));
    }

    return (await res.json()) as FerryPass;
  });

export const cancelMyFerryBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<FerryBooking> => {
    const res = await apiFetch(`/ferry/bookings/${data.id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(await errorMessage(res, "Failed to cancel your booking"));
    }

    return (await res.json()) as FerryBooking;
  });
