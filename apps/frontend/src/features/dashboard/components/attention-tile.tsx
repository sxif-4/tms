import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

/**
 * A stat that is also a job. Unlike `StatCard` these link to the screen where
 * the work gets done, and go quiet (muted) when the count is zero — nothing
 * outstanding shouldn't shout for attention.
 */
export function AttentionTile({
  label,
  value,
  hint,
  icon: Icon,
  to,
  needsAttention = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  to: string;
  needsAttention?: boolean;
}) {
  return (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/40",
        needsAttention && "border-brand/40",
      )}
    >
      <Link to={to} className="block">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardDescription>{label}</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl tabular-nums",
                !needsAttention && "text-muted-foreground",
              )}
            >
              {value}
            </CardTitle>
            {hint ? (
              <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
          <Icon
            className={cn(
              "size-8 shrink-0",
              needsAttention ? "text-brand" : "text-muted-foreground",
            )}
          />
        </CardHeader>
      </Link>
    </Card>
  );
}
