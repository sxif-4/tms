import { createServerFn } from "@tanstack/react-start";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { Overview, SalesPoint, UsagePoint } from "./types";

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
