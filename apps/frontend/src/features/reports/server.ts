import { createServerFn } from "@tanstack/react-start";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type {
  OccupancyPoint,
  Operations,
  Overview,
  SalesPoint,
  ScheduleFillPoint,
  UsagePoint,
} from "./types";

/** Dashboard KPI figures (admin-only on the API). */
export const getOverviewServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Overview> => {
    const res = await apiFetch("/reports/overview");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load overview"));
    return (await res.json()) as Overview;
  },
);

/** Revenue over time, split by domain (keyed on service date). */
export const getSalesServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SalesPoint[]> => {
    const res = await apiFetch("/reports/sales");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load sales report"));
    return (await res.json()) as SalesPoint[];
  },
);

/** Capacity utilization for ferry and event schedules. */
export const getUsageServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<UsagePoint[]> => {
    const res = await apiFetch("/reports/usage");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load usage report"));
    return (await res.json()) as UsagePoint[];
  },
);

/** Today's front-desk position and money still outstanding. */
export const getOperationsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Operations> => {
    const res = await apiFetch("/reports/operations");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load operations"));
    return (await res.json()) as Operations;
  },
);

/** Forward occupancy per hotel, busiest first. */
export const getOccupancyServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<OccupancyPoint[]> => {
    const res = await apiFetch("/reports/occupancy");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load occupancy"));
    return (await res.json()) as OccupancyPoint[];
  },
);

/** Sailings and events departing in the next week. */
export const getScheduleFillServerFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<ScheduleFillPoint[]> => {
  const res = await apiFetch("/reports/schedule-fill");
  if (!res.ok)
    throw new Error(await errorMessage(res, "Failed to load schedules"));
  return (await res.json()) as ScheduleFillPoint[];
});
