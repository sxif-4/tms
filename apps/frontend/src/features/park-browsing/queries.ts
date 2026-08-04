import { mutationOptions, queryOptions } from "@tanstack/react-query";
import {
  createEventBookingServerFn,
  getMyEventBookingsServerFn,
  getMyParkTicketsServerFn,
  getParkAvailabilityServerFn,
  getPublicParkEventServerFn,
  getPublicParkEventsServerFn,
  getPublicTicketTypesServerFn,
  purchaseParkTicketServerFn,
} from "./server";
import type {
  CreateEventBookingInput,
  PublicEventFilters,
  PurchaseParkTicketInput,
} from "./types";

export const publicTicketTypesQueryOptions = queryOptions({
  queryKey: ["public-park", "ticket-types"] as const,
  queryFn: () => getPublicTicketTypesServerFn(),
  staleTime: 60 * 1000,
});

export const publicParkEventsQueryOptions = (
  filters: PublicEventFilters = {},
) =>
  queryOptions({
    queryKey: ["public-park", "events", filters] as const,
    queryFn: () => getPublicParkEventsServerFn({ data: filters }),
    staleTime: 30 * 1000,
  });

export const publicParkEventQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["public-park", "events", id] as const,
    queryFn: () => getPublicParkEventServerFn({ data: { id } }),
    staleTime: 30 * 1000,
  });

/**
 * Keyed by range so flipping the date picker's month doesn't refetch the
 * window already in cache. `from`/`to` travel together — the API rejects one
 * without the other.
 */
export const parkAvailabilityQueryOptions = (from?: string, to?: string) =>
  queryOptions({
    queryKey: ["public-park", "availability", from, to] as const,
    queryFn: () => getParkAvailabilityServerFn({ data: { from, to } }),
    staleTime: 60 * 1000,
  });

/** The visitor's own park tickets — requires auth on the API. */
export const myParkTicketsQueryOptions = queryOptions({
  queryKey: ["park-tickets", "mine"] as const,
  queryFn: () => getMyParkTicketsServerFn(),
  staleTime: 10 * 1000,
});

/** The visitor's own ride/show/beach bookings — requires auth on the API. */
export const myEventBookingsQueryOptions = queryOptions({
  queryKey: ["event-bookings", "mine"] as const,
  queryFn: () => getMyEventBookingsServerFn(),
  staleTime: 10 * 1000,
});

export const purchaseParkTicketMutationOptions = () =>
  mutationOptions({
    mutationFn: (input: PurchaseParkTicketInput) =>
      purchaseParkTicketServerFn({ data: input }),
  });

export const createEventBookingMutationOptions = () =>
  mutationOptions({
    mutationFn: (input: CreateEventBookingInput) =>
      createEventBookingServerFn({ data: input }),
  });
