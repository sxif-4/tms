import { CalendarClock, Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { utcDateKey } from "../constants";
import type { PublicSchedule } from "../types";

function formatSlot(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Upcoming runs of one event. The API only ever returns future schedules, so
 * every row here is bookable in principle — a row is only unselectable when
 * its seats are gone.
 */
export function EventSchedulePicker({
  schedules,
  selectedId,
  onSelect,
  highlightDate,
}: {
  schedules: PublicSchedule[];
  selectedId: number | null;
  onSelect: (schedule: PublicSchedule) => void;
  /** `yyyy-MM-dd` the visitor already holds a ticket for, if any. */
  highlightDate?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Event times" className="space-y-2">
      {schedules.map((schedule) => {
        const soldOut = schedule.remaining <= 0;
        const selected = selectedId === schedule.id;
        const matchesTicketDay =
          highlightDate != null &&
          utcDateKey(schedule.startAt) === highlightDate;

        return (
          <button
            key={schedule.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={soldOut}
            onClick={() => onSelect(schedule)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
              soldOut
                ? "cursor-not-allowed opacity-60"
                : "hover:border-series-park/50",
              selected && "border-series-park ring-1 ring-series-park/40",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                selected
                  ? "bg-series-park/20 text-series-park"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {selected ? (
                <Check className="size-4" />
              ) : (
                <CalendarClock className="size-4" />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-medium">
                {formatSlot(schedule.startAt)}
              </span>
              <span className="block text-sm text-muted-foreground">
                {soldOut
                  ? "Sold out"
                  : `${schedule.remaining} of ${schedule.capacity} seats left`}
              </span>
            </span>

            {matchesTicketDay && !soldOut && (
              <Badge variant="secondary" className="shrink-0">
                Your visit day
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
