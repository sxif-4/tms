import { Badge } from "~/components/ui/badge";
import { gbp } from "~/features/reports/constants";
import { cn } from "~/lib/utils";
import { DOMAIN_ACCENT, DOMAIN_LABELS, type TripItem } from "../trip-items";

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** The second line under the date — duration for a stay, clock time otherwise. */
function timeLabel(item: TripItem) {
  if (item.endAt) {
    const nights = Math.max(
      0,
      Math.round((item.endAt.getTime() - item.startAt.getTime()) / 86_400_000),
    );
    return `${nights} night${nights === 1 ? "" : "s"}`;
  }
  if (item.domain === "park") return "All day";
  return item.startAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * One booking in the merged chronological view, compact enough that a whole
 * trip fits on a screen.
 *
 * The per-domain tabs still own the detailed cards — passes, boarding
 * references and the cancel/change actions live there. This row is for
 * scanning: which day, which domain, what state. The coloured spine carries the
 * domain so the four kinds stay distinguishable without a label being read.
 */
export function TripRow({ item }: { item: TripItem }) {
  const accent = DOMAIN_ACCENT[item.domain];
  const Icon = accent.icon;

  return (
    <li className="relative flex items-center gap-3 overflow-hidden rounded-lg border bg-card p-3 pl-4 transition-colors hover:bg-accent/40 sm:gap-4">
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", accent.spine)}
      />

      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          accent.chip,
        )}
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-medium">{item.title}</p>
          <Badge variant={item.badgeVariant} className="shrink-0">
            {item.statusLabel}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {DOMAIN_LABELS[item.domain]} · {item.detail}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums">
          {dayLabel(item.startAt)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {timeLabel(item)}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm font-semibold tabular-nums">
          {item.free ? "Free" : gbp(item.amount)}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          {item.reference}
        </p>
      </div>
    </li>
  );
}
