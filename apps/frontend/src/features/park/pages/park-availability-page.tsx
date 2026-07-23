import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { ParkDayDialog } from "../components/park-day-dialog";
import { NEAR_CAPACITY_THRESHOLD, toDateKey } from "../constants";
import { parkDaysQueryOptions } from "../queries";
import type { ParkDay } from "../types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** First/last UTC-midnight day of `month`'s calendar month. */
function monthBounds(month: Date): { from: string; to: string } {
  const first = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1),
  );
  const last = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  );
  return { from: toDateKey(first), to: toDateKey(last) };
}

/** Blank cells before the 1st so the grid starts on a Monday. */
function leadingBlanks(month: Date): number {
  const firstDow = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1),
  ).getUTCDay();
  return (firstDow + 6) % 7; // JS weeks start Sunday; ours start Monday.
}

export function ParkAvailabilityPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [selected, setSelected] = useState<ParkDay | null>(null);

  const { from, to } = monthBounds(month);
  const { data: days } = useSuspenseQuery(parkDaysQueryOptions(from, to));

  const today = toDateKey(new Date());
  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const shiftMonth = (delta: number) =>
    setMonth(
      new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1)),
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Availability</h1>
        <p className="text-sm text-muted-foreground">
          How many tickets each day can sell. Click a day to cap it or close the
          park.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{monthLabel}</CardTitle>
            <CardDescription>
              Days without an override run on the default capacity.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-muted-foreground px-1 text-center text-xs font-medium"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: leadingBlanks(month) }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => (
              <DayCell
                key={day.date}
                day={day}
                isToday={day.date === today}
                onClick={() => setSelected(day)}
              />
            ))}
          </div>

          <Legend />
        </CardContent>
      </Card>

      <ParkDayDialog
        open={selected != null}
        onOpenChange={(o) => !o && setSelected(null)}
        day={selected}
      />
    </div>
  );
}

function DayCell({
  day,
  isToday,
  onClick,
}: {
  day: ParkDay;
  isToday: boolean;
  onClick: () => void;
}) {
  const ratio = day.capacity > 0 ? day.sold / day.capacity : 0;
  const full = !day.isClosed && day.capacity > 0 && day.sold >= day.capacity;
  const near = !full && !day.isClosed && ratio >= NEAR_CAPACITY_THRESHOLD;
  const dayNum = Number(day.date.slice(8, 10));

  return (
    <button
      type="button"
      onClick={onClick}
      // Colour alone never carries the state — every cell also spells out its
      // numbers, and closed days say "Closed".
      aria-label={`${day.date}: ${
        day.isClosed ? "closed" : `${day.remaining} of ${day.capacity} left`
      }`}
      className={cn(
        "flex min-h-20 flex-col items-start gap-1 rounded-lg border p-2 text-left transition-colors",
        "hover:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none",
        day.isClosed && "border-destructive/40 bg-destructive/10",
        full && "border-destructive/40 bg-destructive/5",
        near && "border-amber-500/50 bg-amber-500/10",
        !day.isDefault && !day.isClosed && !full && !near && "border-ring/40",
        isToday && "ring-ring/40 ring-2",
      )}
    >
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          isToday && "text-primary",
        )}
      >
        {dayNum}
      </span>
      {day.isClosed ? (
        <span className="text-destructive text-xs font-medium">Closed</span>
      ) : (
        <span className="text-muted-foreground text-xs tabular-nums">
          {day.remaining} left
        </span>
      )}
      {day.note && (
        <span className="text-muted-foreground truncate text-[10px]">
          {day.note}
        </span>
      )}
    </button>
  );
}

function Legend() {
  return (
    <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
      <LegendItem className="border-ring/40" label="Custom cap" />
      <LegendItem className="border-amber-500/50 bg-amber-500/10" label="Nearly full" />
      <LegendItem className="border-destructive/40 bg-destructive/5" label="Sold out" />
      <LegendItem className="border-destructive/40 bg-destructive/10" label="Closed" />
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded border", className)} />
      {label}
    </span>
  );
}
