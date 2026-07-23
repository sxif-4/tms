import { queryOptions } from "@tanstack/react-query";
import {
  getEventBookingsServerFn,
  getEventSchedulesServerFn,
  getParkDashboardServerFn,
  getParkDaysServerFn,
  getParkEventServerFn,
  getParkEventsReportServerFn,
  getParkEventsServerFn,
  getParkSalesReportServerFn,
  getParkTicketsServerFn,
  getParkTicketTypesServerFn,
  getParkVisitorsReportServerFn,
} from "./server";
import type {
  EventBookingStatus,
  EventType,
  LocationType,
  SalesGroupBy,
  TicketChannel,
  TicketStatus,
} from "./types";

/** Priced catalog — changes rarely, so it can sit stale a little longer. */
export const parkTicketTypesQueryOptions = queryOptions({
  queryKey: ["park-ticket-types"] as const,
  queryFn: () => getParkTicketTypesServerFn(),
  staleTime: 30 * 1000,
});

export const parkEventsQueryOptions = (
  filters: {
    eventType?: EventType;
    locationType?: LocationType;
    isActive?: boolean;
  } = {},
) =>
  queryOptions({
    queryKey: ["park-events", filters] as const,
    queryFn: () => getParkEventsServerFn({ data: filters }),
    staleTime: 30 * 1000,
  });

export const parkEventQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["park-event", id] as const,
    queryFn: () => getParkEventServerFn({ data: { id } }),
    staleTime: 30 * 1000,
  });

export const eventSchedulesQueryOptions = (
  filters: { eventId?: number; from?: string; to?: string } = {},
) =>
  queryOptions({
    queryKey: ["event-schedules", filters] as const,
    queryFn: () => getEventSchedulesServerFn({ data: filters }),
    // Seats move as visitors book — keep this fresher than the catalog.
    staleTime: 15 * 1000,
  });

export const parkTicketsQueryOptions = (
  filters: {
    visitDate?: string;
    status?: TicketStatus;
    channel?: TicketChannel;
    q?: string;
  } = {},
) =>
  queryOptions({
    queryKey: ["park-tickets", filters] as const,
    queryFn: () => getParkTicketsServerFn({ data: filters }),
    staleTime: 15 * 1000,
  });

export const eventBookingsQueryOptions = (
  filters: {
    eventId?: number;
    scheduleId?: number;
    status?: EventBookingStatus;
  } = {},
) =>
  queryOptions({
    queryKey: ["event-bookings", filters] as const,
    queryFn: () => getEventBookingsServerFn({ data: filters }),
    staleTime: 15 * 1000,
  });

export const parkDaysQueryOptions = (from?: string, to?: string) =>
  queryOptions({
    queryKey: ["park-days", from, to] as const,
    queryFn: () => getParkDaysServerFn({ data: { from, to } }),
    staleTime: 15 * 1000,
  });

export const parkDashboardQueryOptions = queryOptions({
  queryKey: ["park-dashboard"] as const,
  queryFn: () => getParkDashboardServerFn(),
  staleTime: 15 * 1000,
});

export const parkSalesReportQueryOptions = (
  from?: string,
  to?: string,
  groupBy: SalesGroupBy = "day",
) =>
  queryOptions({
    queryKey: ["park-sales-report", from, to, groupBy] as const,
    queryFn: () => getParkSalesReportServerFn({ data: { from, to, groupBy } }),
    staleTime: 30 * 1000,
  });

export const parkVisitorsReportQueryOptions = (from?: string, to?: string) =>
  queryOptions({
    queryKey: ["park-visitors-report", from, to] as const,
    queryFn: () => getParkVisitorsReportServerFn({ data: { from, to } }),
    staleTime: 30 * 1000,
  });

export const parkEventsReportQueryOptions = (from?: string, to?: string) =>
  queryOptions({
    queryKey: ["park-events-report", from, to] as const,
    queryFn: () => getParkEventsReportServerFn({ data: { from, to } }),
    staleTime: 30 * 1000,
  });
