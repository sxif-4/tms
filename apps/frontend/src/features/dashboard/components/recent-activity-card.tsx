import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, ScrollTextIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { initials } from "~/features/users/utils";
import type { AuditLog } from "~/features/audit-logs/types";

/** "2 hours ago" — the audit table already shows exact timestamps. */
function relative(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * The most recent privileged actions across every domain — the overview's
 * answer to "what has been happening while I was away".
 */
export function RecentActivityCard({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Privileged actions across the system</CardDescription>
        <CardAction>
          <ScrollTextIcon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-2">
        {logs.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            Nothing recorded yet.
          </p>
        ) : (
          <>
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <Avatar>
                  <AvatarFallback>{initials(log.userName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{log.userName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {log.subjectType} #{log.subjectId}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="secondary">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {relative(log.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            <Link
              to="/dashboard/admin/audit-logs"
              className="mt-1 flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View all audit logs
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
