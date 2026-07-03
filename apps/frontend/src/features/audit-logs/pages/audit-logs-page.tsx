import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { auditActionsQueryOptions, auditLogsQueryOptions } from "../queries";

const fmt = (iso: string) => new Date(iso).toLocaleString();

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const actionFilter = action === "all" ? undefined : action;

  const { data, isFetching } = useQuery({
    ...auditLogsQueryOptions(page, actionFilter),
    placeholderData: keepPreviousData,
  });
  const { data: actions } = useQuery(auditActionsQueryOptions);

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Audit logs</h1>
        <p className="text-sm text-muted-foreground">
          A record of privileged actions across the system.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={action}
          onValueChange={(v) => {
            setAction(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All actions</SelectItem>
              {actions?.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {total} {total === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Who</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Subject</th>
              <th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  No audit entries.
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="whitespace-nowrap p-3 text-muted-foreground tabular-nums">
                    {fmt(log.createdAt)}
                  </td>
                  <td className="whitespace-nowrap p-3">{log.userName}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{log.action}</Badge>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {log.subjectType} #{log.subjectId}
                  </td>
                  <td className="max-w-xs truncate p-3 font-mono text-xs text-muted-foreground">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
          >
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
