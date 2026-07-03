import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFetch, errorMessage } from "~/lib/server-api";
import type { AuditLogPage } from "./types";

const paramsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  action: z.string().optional(),
});

/** Paginated audit-log listing (admin-only on the API). */
export const getAuditLogsServerFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => paramsSchema.parse(input))
  .handler(async ({ data }): Promise<AuditLogPage> => {
    const q = new URLSearchParams();
    if (data.page) q.set("page", String(data.page));
    if (data.pageSize) q.set("pageSize", String(data.pageSize));
    if (data.action) q.set("action", data.action);
    const res = await apiFetch(`/audit-logs?${q.toString()}`);
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load audit logs"));
    return (await res.json()) as AuditLogPage;
  });

/** Distinct action names for the filter dropdown. */
export const getAuditActionsServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const res = await apiFetch("/audit-logs/actions");
    if (!res.ok)
      throw new Error(await errorMessage(res, "Failed to load actions"));
    return (await res.json()) as string[];
  },
);
