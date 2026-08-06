import { queryOptions } from "@tanstack/react-query";
import { getCustomerServerFn, searchCustomersServerFn } from "./server";

/** Customer search. An empty query lists the most recent registrations. */
export const customerSearchQueryOptions = (q?: string) =>
  queryOptions({
    queryKey: ["customers", "search", q ?? ""] as const,
    queryFn: () => searchCustomersServerFn({ data: { q } }),
    staleTime: 30 * 1000,
  });

/** One customer's cross-domain profile. */
export const customerQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["customers", id] as const,
    queryFn: () => getCustomerServerFn({ data: { id } }),
    staleTime: 15 * 1000,
  });
