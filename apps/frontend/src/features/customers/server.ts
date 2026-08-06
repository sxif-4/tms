import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { CustomerProfile, CustomerSearchResult } from "./types";

const searchSchema = z.object({ q: z.string().trim().max(100).optional() });

/** Searches customers by name, email, or an exact booking reference. */
export const searchCustomersServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => searchSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<CustomerSearchResult[]> => {
    const query = data.q ? `?q=${encodeURIComponent(data.q)}` : "";
    const res = await apiFetch(`/customers${query}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to search customers"));
    return (await res.json()) as CustomerSearchResult[];
  });

const customerIdSchema = z.object({ id: z.number().int().positive() });

/** One customer's bookings and payments across every domain. */
export const getCustomerServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => customerIdSchema.parse(input))
  .handler(async ({ data }): Promise<CustomerProfile> => {
    const res = await apiFetch(`/customers/${data.id}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load customer"));
    return (await res.json()) as CustomerProfile;
  });

const cancelSchema = z.object({
  domain: z.enum(["hotel", "ferry", "event", "park"]),
  id: z.number().int().positive(),
});

/**
 * Cancels a booking on the customer's behalf. Each domain owns its own rules
 * (refunds, capacity release, the complimentary-ferry cascade), so this routes
 * to that domain's existing endpoint rather than re-implementing any of it.
 */
export const cancelCustomerBookingServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => cancelSchema.parse(input))
  .handler(async ({ data }): Promise<void> => {
    const json = {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    } as const;

    const request = {
      hotel: () => apiFetch(`/hotel-bookings/${data.id}/status`, json),
      event: () => apiFetch(`/event-bookings/${data.id}/status`, json),
      park: () => apiFetch(`/park-tickets/${data.id}/status`, json),
      // Ferry has a dedicated cancel that also refunds an issued pass.
      ferry: () =>
        apiFetch(`/ferry/bookings/${data.id}/cancel`, { method: "POST" }),
    }[data.domain];

    const res = await request();
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to cancel booking"));
  });
