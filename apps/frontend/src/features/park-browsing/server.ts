import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type {
  EventBooking,
  ParkTicket,
  PublicDayAvailability,
  PublicEvent,
  PublicEventDetail,
  PublicTicketType,
} from "./types";

const EVENT_TYPES = ["ride", "show", "beach_event"] as const;
const LOCATION_TYPES = ["theme_park", "beach"] as const;

/** `yyyy-MM-dd` — the calendar-key shape the park API speaks in. */
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd");

const eventFiltersSchema = z.object({
  eventType: z.enum(EVENT_TYPES).optional(),
  locationType: z.enum(LOCATION_TYPES).optional(),
});

const idSchema = z.object({ id: z.number().int().positive() });

const availabilitySchema = z.object({
  from: dateKey.optional(),
  to: dateKey.optional(),
});

const purchaseSchema = z.object({
  ticketTypeId: z.number().int().positive(),
  visitDate: dateKey,
  quantity: z.number().int().min(1).max(50),
});

const createEventBookingSchema = z.object({
  eventScheduleId: z.number().int().positive(),
  parkTicketId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50),
});

// ── Public browsing (unauthenticated on the API) ──────────────────────────

export const getPublicTicketTypesServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<PublicTicketType[]> => {
  const res = await apiFetch("/public/park/ticket-types");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load ticket types"));
  return (await res.json()) as PublicTicketType[];
});

export const getPublicParkEventsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => eventFiltersSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<PublicEvent[]> => {
    const params = new URLSearchParams();
    if (data.eventType) params.set("eventType", data.eventType);
    if (data.locationType) params.set("locationType", data.locationType);
    const qs = params.toString();
    const res = await apiFetch(`/public/park/events${qs ? `?${qs}` : ""}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load events"));
    return (await res.json()) as PublicEvent[];
  });

export const getPublicParkEventServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<PublicEventDetail> => {
    const res = await apiFetch(`/public/park/events/${data.id}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load the event"));
    return (await res.json()) as PublicEventDetail;
  });

/**
 * Per-day remaining tickets for the date picker. `from`/`to` must be sent
 * together — the API rejects one without the other.
 */
export const getParkAvailabilityServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => availabilitySchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<PublicDayAvailability[]> => {
    const params = new URLSearchParams();
    if (data.from && data.to) {
      params.set("from", data.from);
      params.set("to", data.to);
    }
    const qs = params.toString();
    const res = await apiFetch(`/public/park/availability${qs ? `?${qs}` : ""}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load availability"));
    return (await res.json()) as PublicDayAvailability[];
  });

// ── Authenticated visitor actions ─────────────────────────────────────────

/** Requires auth — the buyer is taken from the JWT, not the body. */
export const purchaseParkTicketServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => purchaseSchema.parse(input))
  .handler(async ({ data }): Promise<ParkTicket> => {
    const res = await apiFetch("/park-tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to buy tickets"));
    return (await res.json()) as ParkTicket;
  });

/** Requires auth — returns only the caller's own tickets. */
export const getMyParkTicketsServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<ParkTicket[]> => {
  const res = await apiFetch("/park-tickets/mine");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load your tickets"));
  return (await res.json()) as ParkTicket[];
});

/**
 * Requires auth, and a park ticket the caller owns for the same day as the
 * schedule — the API enforces all four prerequisite checks.
 */
export const createEventBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createEventBookingSchema.parse(input))
  .handler(async ({ data }): Promise<EventBooking> => {
    const res = await apiFetch("/event-bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to book seats"));
    return (await res.json()) as EventBooking;
  });

/** Requires auth — returns only the caller's own event bookings. */
export const getMyEventBookingsServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<EventBooking[]> => {
  const res = await apiFetch("/event-bookings/mine");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load your bookings"));
  return (await res.json()) as EventBooking[];
});
