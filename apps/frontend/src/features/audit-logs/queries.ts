import { queryOptions } from "@tanstack/react-query";
import { getAuditActionsServerFn, getAuditLogsServerFn } from "./server";

export const auditLogsQueryOptions = (
  page: number,
  action: string | undefined,
) =>
  queryOptions({
    queryKey: ["audit-logs", { page, action: action ?? "all" }] as const,
    queryFn: () =>
      getAuditLogsServerFn({ data: { page, pageSize: 20, action } }),
    staleTime: 15 * 1000,
  });

export const auditActionsQueryOptions = queryOptions({
  queryKey: ["audit-logs", "actions"] as const,
  queryFn: () => getAuditActionsServerFn(),
  staleTime: 5 * 60 * 1000,
});
