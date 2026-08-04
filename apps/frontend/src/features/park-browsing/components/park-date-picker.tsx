import * as React from "react";
import { format } from "date-fns";
import type { DayButton } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/lib/utils";
import {
  PARK_DAY_STATE_CLASS,
  PARK_DAY_STATE_LABEL,
  isParkDayDisabled,
  parkDayState,
} from "../constants";
import type { PublicDayAvailability } from "../types";

const STATES = ["available", "limited", "sold_out", "closed"] as const;

/**
 * Single-date park calendar. Mirrors the hotel `AvailabilityCalendar`, but in
 * `mode="single"` (a park ticket is one day, not a range) and driven by
 * `/public/park/availability`, which returns only `remaining` and `isClosed`.
 */
function ParkDayButton({
  className,
  day,
  modifiers,
  availabilityMap,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  availabilityMap: Map<string, PublicDayAvailability>;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const info = availabilityMap.get(format(day.date, "yyyy-MM-dd"));
  const state = info ? parkDayState(info) : undefined;
  const showBar = !modifiers.outside && info;

  const dateLabel = day.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={modifiers.selected}
      aria-label={
        state ? `${dateLabel}, ${PARK_DAY_STATE_LABEL[state]}` : dateLabel
      }
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[selected-single=true]:rounded-(--cell-radius) data-[selected-single=true]:bg-brand data-[selected-single=true]:text-brand-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        className,
      )}
      {...props}
    >
      <span>{day.date.getDate()}</span>
      {showBar && state && (
        <span
          className={cn(
            "mx-auto h-1 w-5 rounded-full",
            PARK_DAY_STATE_CLASS[state],
          )}
        />
      )}
    </Button>
  );
}

export function ParkDatePicker({
  data,
  selected,
  onSelect,
  onMonthChange,
  month,
  className,
  showLegend = true,
}: {
  data: PublicDayAvailability[];
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  onMonthChange?: (month: Date) => void;
  month?: Date;
  className?: string;
  showLegend?: boolean;
}) {
  const availabilityMap = React.useMemo(
    () => new Map(data.map((d) => [d.date, d])),
    [data],
  );

  /**
   * Closed and sold-out days are unselectable, as is anything before today —
   * the API rejects a past `visitDate` with a 400, and an enabled button that
   * always fails is worse than no button.
   */
  const isDisabled = React.useCallback(
    (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
      const info = availabilityMap.get(format(date, "yyyy-MM-dd"));
      // Outside the fetched window we can't know — let the API be the judge.
      return info ? isParkDayDisabled(info) : false;
    },
    [availabilityMap],
  );

  return (
    <div className={className}>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={onMonthChange}
        disabled={isDisabled}
        className="mx-auto w-fit [--cell-size:--spacing(10)]"
        components={{
          DayButton: (dayButtonProps) => (
            <ParkDayButton
              availabilityMap={availabilityMap}
              {...dayButtonProps}
            />
          ),
        }}
      />
      {showLegend && (
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          {STATES.map((state) => (
            <span key={state} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1 w-5 rounded-full",
                  PARK_DAY_STATE_CLASS[state],
                )}
              />
              {PARK_DAY_STATE_LABEL[state]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
