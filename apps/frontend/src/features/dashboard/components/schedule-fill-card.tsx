import { CalendarClockIcon, FerrisWheelIcon, ShipIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { ScheduleFillPoint } from "~/features/reports/types";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Anything this empty a week out is worth a second look. */
const UNDERSOLD_THRESHOLD = 25;

/**
 * What is departing in the next week and how full it is. Sailings and events
 * share the list deliberately — the admin's question is "what is running soon
 * and is it selling", not "show me ferries".
 */
export function ScheduleFillCard({ data }: { data: ScheduleFillPoint[] }) {
  const undersold = data.filter((s) => s.fillRate < UNDERSOLD_THRESHOLD).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departing this week</CardTitle>
        <CardDescription>Sailings and events, soonest first</CardDescription>
        <CardAction>
          {undersold > 0 ? (
            <Badge variant="outline">{undersold} under 25%</Badge>
          ) : (
            <CalendarClockIcon className="size-5 text-muted-foreground" />
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-2">
        {data.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            Nothing scheduled in the next seven days.
          </p>
        ) : (
          data.map((item) => {
            const Icon = item.domain === "ferry" ? ShipIcon : FerrisWheelIcon;
            return (
              <div
                key={`${item.domain}-${item.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {when(item.startAt)} · {item.detail}
                  </p>
                </div>
                <div className="flex w-20 flex-col items-end">
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      item.fillRate < UNDERSOLD_THRESHOLD &&
                        "text-muted-foreground",
                    )}
                  >
                    {item.fillRate}%
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.booked}/{item.capacity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
