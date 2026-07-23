import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  /** Optional context under the value, e.g. "Last 30 days". */
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
          {hint ? (
            <p className="text-muted-foreground text-xs">{hint}</p>
          ) : null}
        </div>
        <Icon className="size-8 shrink-0 text-muted-foreground" />
      </CardHeader>
    </Card>
  );
}
