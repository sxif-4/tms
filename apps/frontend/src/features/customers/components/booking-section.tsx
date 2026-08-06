import type { LucideIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { gbpExact, isCancellable, statusVariant } from "../constants";
import type { BookingDomain } from "../types";

/** One booking, flattened from whichever domain it came from. */
export interface BookingRow {
  id: number;
  reference: string;
  title: string;
  subtitle: string;
  amount: string;
  status: string;
}

export function BookingSection({
  label,
  description,
  icon: Icon,
  domain,
  rows,
  onCancel,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  domain: BookingDomain;
  rows: BookingRow[];
  onCancel: (domain: BookingDomain, row: BookingRow) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Icon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {row.reference} · {row.subtitle}
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {gbpExact(row.amount)}
            </span>
            {isCancellable(row.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(domain, row)}
              >
                Cancel
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
