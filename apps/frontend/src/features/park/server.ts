import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type {
  EventBooking,
  EventReportRow,
  EventSchedule,
  ParkDashboardResponse,
  ParkDay,
  ParkEvent,
  ParkEventDetail,
  ParkTicket,
  ParkTicketType,
  SalesRow,
  VisitorRow,
} from "./types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;
/** `2026-07-15` — the key the park API speaks in for whole days. */
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const EVENT_TYPE_VALUES = ["ride", "show", "beach_event"] as const;
const LOCATION_TYPE_VALUES = ["theme_park", "beach"] as const;
const TICKET_STATUS_VALUES = [
  "active",
  "used",
  "cancelled",
  "refunded",
] as const;
const TICKET_CHANNEL_VALUES = ["online", "gate"] as const;
const TICKET_TRANSITION_VALUES = ["cancelled", "refunded"] as const;
const BOOKING_TRANSITION_VALUES = ["confirmed", "cancelled"] as const;
const SALES_GROUP_BY_VALUES = ["day", "ticketType", "channel"] as const;

/** Drops undefined/empty params so we never send `?status=undefined`. */
function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

// ── Ticket types ──────────────────────────────────────────────────────────

export const getParkTicketTypesServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<ParkTicketType[]> => {
  const res = await apiFetch("/park-ticket-types");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load ticket types"));
  return (await res.json()) as ParkTicketType[];
});

const ticketTypeInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  price: z.string().regex(DECIMAL, "Price must be a decimal like 45.00"),
});

export const createParkTicketTypeServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => ticketTypeInputSchema.parse(input))
  .handler(async ({ data }): Promise<ParkTicketType> => {
    const res = await apiFetch("/park-ticket-types", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create ticket type"));
    return (await res.json()) as ParkTicketType;
  });

export const updateParkTicketTypeServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    ticketTypeInputSchema
      .partial()
      .extend({ id: z.number().int().positive() })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ParkTicketType> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/park-ticket-types/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update ticket type"));
    return (await res.json()) as ParkTicketType;
  });

export const deleteParkTicketTypeServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/park-ticket-types/${data.id}`, {
      method: "DELETE",
    });
    // 409 when tickets were sold against it — surface the API's reason.
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete ticket type"));
  });

// ── Events ────────────────────────────────────────────────────────────────

export const getParkEventsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        eventType: z.enum(EVENT_TYPE_VALUES).optional(),
        locationType: z.enum(LOCATION_TYPE_VALUES).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<ParkEvent[]> => {
    const res = await apiFetch(
      `/events${qs({
        eventType: data.eventType,
        locationType: data.locationType,
        isActive: data.isActive === undefined ? undefined : String(data.isActive),
      })}`,
    );
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load events"));
    return (await res.json()) as ParkEvent[];
  });

export const getParkEventServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<ParkEventDetail> => {
    const res = await apiFetch(`/events/${data.id}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load event"));
    return (await res.json()) as ParkEventDetail;
  });

const eventInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  eventType: z.enum(EVENT_TYPE_VALUES),
  locationType: z.enum(LOCATION_TYPE_VALUES),
  basePrice: z.string().regex(DECIMAL, "Price must be a decimal like 12.50"),
  isActive: z.boolean().optional(),
});

export const createParkEventServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => eventInputSchema.parse(input))
  .handler(async ({ data }): Promise<ParkEvent> => {
    const res = await apiFetch("/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create event"));
    return (await res.json()) as ParkEvent;
  });

export const updateParkEventServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    eventInputSchema
      .partial()
      .extend({ id: z.number().int().positive() })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ParkEvent> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/events/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update event"));
    return (await res.json()) as ParkEvent;
  });

export const deleteParkEventServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/events/${data.id}`, { method: "DELETE" });
    // 409 when schedules exist — the API steers staff to isActive: false.
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete event"));
  });

// ── Event schedules ───────────────────────────────────────────────────────

export const getEventSchedulesServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        eventId: z.number().int().positive().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<EventSchedule[]> => {
    const res = await apiFetch(`/event-schedules${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load schedules"));
    return (await res.json()) as EventSchedule[];
  });

const scheduleInputSchema = z.object({
  eventId: z.number().int().positive(),
  startAt: z.string().min(1),
  capacity: z.number().int().min(1),
});

export const createEventScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => scheduleInputSchema.parse(input))
  .handler(async ({ data }): Promise<EventSchedule> => {
    const res = await apiFetch("/event-schedules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to create schedule"));
    return (await res.json()) as EventSchedule;
  });

export const updateEventScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        startAt: z.string().min(1).optional(),
        capacity: z.number().int().min(1).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<EventSchedule> => {
    const { id, ...body } = data;
    const res = await apiFetch(`/event-schedules/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // 400 when the new capacity is below the seats already booked.
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update schedule"));
    return (await res.json()) as EventSchedule;
  });

export const deleteEventScheduleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/event-schedules/${data.id}`, {
      method: "DELETE",
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to delete schedule"));
  });

// ── Park tickets: sales and gate ──────────────────────────────────────────

export const getParkTicketsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        visitDate: z.string().regex(DATE_KEY).optional(),
        status: z.enum(TICKET_STATUS_VALUES).optional(),
        channel: z.enum(TICKET_CHANNEL_VALUES).optional(),
        q: z.string().trim().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<ParkTicket[]> => {
    const res = await apiFetch(`/park-tickets${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load tickets"));
    return (await res.json()) as ParkTicket[];
  });

/** Read-only preview for the gate screen — deliberately does not check anyone in. */
export const lookupParkTicketServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ reference: z.string().trim().min(1).max(20) }).parse(input),
  )
  .handler(async ({ data }): Promise<ParkTicket> => {
    const res = await apiFetch(
      `/park-tickets/lookup/${encodeURIComponent(data.reference)}`,
    );
    if (!res.ok)
      throw new Error(await errorMessage(res, "No ticket with that reference"));
    return (await res.json()) as ParkTicket;
  });

/**
 * Gate check-in. The API answers 404/409 with a *specific* reason (wrong day,
 * already used, cancelled) — that message is what the gate screen shows, so it
 * must reach the caller intact rather than being flattened to a generic error.
 */
export const validateParkTicketServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ ticketReference: z.string().trim().min(1).max(20) }).parse(input),
  )
  .handler(async ({ data }): Promise<ParkTicket> => {
    const res = await apiFetch("/park-tickets/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to validate ticket"));
    return (await res.json()) as ParkTicket;
  });

export const gateSaleServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        ticketTypeId: z.number().int().positive(),
        visitDate: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(255),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ParkTicket> => {
    const res = await apiFetch("/park-tickets/gate-sale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    // 409 when the day is closed or sold out.
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to complete gate sale"));
    return (await res.json()) as ParkTicket;
  });

export const updateParkTicketStatusServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        status: z.enum(TICKET_TRANSITION_VALUES),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ParkTicket> => {
    const res = await apiFetch(`/park-tickets/${data.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update ticket"));
    return (await res.json()) as ParkTicket;
  });

// ── Event bookings ────────────────────────────────────────────────────────

export const getEventBookingsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        eventId: z.number().int().positive().optional(),
        scheduleId: z.number().int().positive().optional(),
        status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<EventBooking[]> => {
    const res = await apiFetch(`/event-bookings${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load bookings"));
    return (await res.json()) as EventBooking[];
  });

export const updateEventBookingStatusServerFn = createServerFn({
  method: "POST",
})
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        status: z.enum(BOOKING_TRANSITION_VALUES),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<EventBooking> => {
    const res = await apiFetch(`/event-bookings/${data.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to update booking"));
    return (await res.json()) as EventBooking;
  });

// ── Park days (availability calendar) ─────────────────────────────────────

export const getParkDaysServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        from: z.string().regex(DATE_KEY).optional(),
        to: z.string().regex(DATE_KEY).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<ParkDay[]> => {
    const res = await apiFetch(`/park-days${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load availability"));
    return (await res.json()) as ParkDay[];
  });

/** Upserts the day's override. 400 if capacity is below what's already sold. */
export const upsertParkDayServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        date: z.string().regex(DATE_KEY),
        capacity: z.number().int().min(0),
        isClosed: z.boolean().optional(),
        note: z.string().trim().max(255).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ParkDay> => {
    const { date, ...body } = data;
    const res = await apiFetch(`/park-days/${date}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to save availability"));
    return (await res.json()) as ParkDay;
  });

/** Clears the override — the day reverts to the configured default capacity. */
export const clearParkDayServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ date: z.string().regex(DATE_KEY) }).parse(input),
  )
  .handler(async ({ data }): Promise<void> => {
    const res = await apiFetch(`/park-days/${data.date}`, { method: "DELETE" });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to clear availability"));
  });

// ── Dashboard & reports ───────────────────────────────────────────────────

export const getParkDashboardServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ParkDashboardResponse> => {
    const res = await apiFetch("/park-dashboard");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load dashboard"));
    return (await res.json()) as ParkDashboardResponse;
  },
);

export const getParkSalesReportServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        from: z.string().optional(),
        to: z.string().optional(),
        groupBy: z.enum(SALES_GROUP_BY_VALUES).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<SalesRow[]> => {
    const res = await apiFetch(`/park-reports/sales${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load sales report"));
    return (await res.json()) as SalesRow[];
  });

export const getParkVisitorsReportServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({ from: z.string().optional(), to: z.string().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<VisitorRow[]> => {
    const res = await apiFetch(`/park-reports/visitors${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load visitor report"));
    return (await res.json()) as VisitorRow[];
  });

export const getParkEventsReportServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({ from: z.string().optional(), to: z.string().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<EventReportRow[]> => {
    const res = await apiFetch(`/park-reports/events${qs(data)}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load event report"));
    return (await res.json()) as EventReportRow[];
  });
