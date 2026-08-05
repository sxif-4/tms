import { cn } from "~/lib/utils";

/** A sailing this full is worth flagging before it sells out. */
const NEAR_CAPACITY = 0.9;

/**
 * `booked / capacity` as a labelled bar. Turns amber near the cap and red when
 * full, so a sailing about to sell out reads at a glance without the operator
 * doing the arithmetic.
 */
export function FerryCapacityBar({
  booked,
  capacity,
  className,
}: {
  booked: number;
  capacity: number;
  className?: string;
}) {
  const ratio = capacity > 0 ? booked / capacity : 0;
  const pct = Math.min(100, Math.round(ratio * 100));
  const full = capacity > 0 && booked >= capacity;
  const near = !full && ratio >= NEAR_CAPACITY;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={booked}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`${booked} of ${capacity} seats booked`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            full
              ? "bg-destructive"
              : near
                ? "bg-amber-500"
                : "bg-[var(--series-ferry)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs tabular-nums">
        {booked} / {capacity} · {pct}%
      </span>
    </div>
  );
}
