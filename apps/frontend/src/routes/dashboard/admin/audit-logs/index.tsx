import { createFileRoute } from "@tanstack/react-router";
import { AuditLogsPage } from "~/features/audit-logs/pages/audit-logs-page";
import {
  auditActionsQueryOptions,
  auditLogsQueryOptions,
} from "~/features/audit-logs/queries";

export const Route = createFileRoute("/dashboard/admin/audit-logs/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(auditLogsQueryOptions(1, undefined)),
      context.queryClient.ensureQueryData(auditActionsQueryOptions),
    ]);
  },
  component: AuditLogsPage,
});
