import * as React from "react";
import { format } from "date-fns";
import type { DateRange, DayButton } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/lib/utils";
import { AVAILABILITY_TIER_CLASS, AVAILABILITY_TIER_LABEL } from "../constants";
import type { DayAvailability } from "../types";

const TIERS = ["high", "medium", "low", "none"] as const;

function AvailabilityDayButton({
  className,
  day,
  modifiers,
  availabilityMap,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  availabilityMap: Map<string, DayAvailability>;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const info = availabilityMap.get(format(day.date, "yyyy-MM-dd"));
  const showBar = !modifiers.outside && !modifiers.disabled && info;

  const dateLabel = day.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const availabilityLabel = info ? AVAILABILITY_TIER_LABEL[info.level] : undefined;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      aria-label={
        availabilityLabel ? `${dateLabel}, ${availabilityLabel}` : dateLabel
      }
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        className,
      )}
      {...props}
    >
      <span>{day.date.getDate()}</span>
      {showBar && (
        <span
          className={cn(
            "mx-auto h-1 w-5 rounded-full",
            AVAILABILITY_TIER_CLASS[info.level],
          )}
        />
      )}
    </Button>
  );
}

export function AvailabilityCalendar({
  data,
  selected,
  onSelect,
  disabled,
  numberOfMonths = 1,
  onMonthChange,
  className,
  showLegend = true,
}: {
  data: DayAvailability[];
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  disabled?: (date: Date) => boolean;
  numberOfMonths?: number;
  onMonthChange?: (month: Date) => void;
  className?: string;
  showLegend?: boolean;
}) {
  const availabilityMap = React.useMemo(
    () => new Map(data.map((d) => [d.date, d])),
    [data],
  );

  return (
    <div className={className}>
      <Calendar
        mode="range"
        selected={selected}
        onSelect={onSelect}
        numberOfMonths={numberOfMonths}
        disabled={disabled}
        onMonthChange={onMonthChange}
        className="mx-auto w-fit [--cell-size:--spacing(10)]"
        components={{
          DayButton: (dayButtonProps) => (
            <AvailabilityDayButton
              availabilityMap={availabilityMap}
              {...dayButtonProps}
            />
          ),
        }}
      />
      {showLegend && (
        <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          {TIERS.map((tier) => (
            <span key={tier} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1 w-5 rounded-full",
                  AVAILABILITY_TIER_CLASS[tier],
                )}
              />
              {AVAILABILITY_TIER_LABEL[tier]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
