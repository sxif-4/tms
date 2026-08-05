import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

const STEPS = ["Dates & room", "Review & pay"] as const;

/**
 * Funnel indicator shared by /book (step 0) and /checkout (step 1). The two
 * steps are real routes, so this reflects where you are rather than driving it.
 */
export function BookingSteps({ current }: { current: 0 | 1 }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done
                  ? "border-transparent bg-brand text-brand-foreground"
                  : active
                    ? "border-brand text-brand"
                    : "border-border text-muted-foreground",
              )}
              aria-hidden
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium whitespace-nowrap",
                active ? "text-foreground" : "text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="ml-1 h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
