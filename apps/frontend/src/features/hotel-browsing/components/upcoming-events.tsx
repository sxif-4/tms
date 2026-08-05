import { Link } from "@tanstack/react-router";
import { EVENT_TYPE_LABELS } from "~/features/park-browsing/constants";
import type { PublicUpcomingSchedule } from "~/features/park-browsing/types";
import { cn } from "~/lib/utils";

/**
 * The park's real agenda — the next few runs across every active event, from
 * `/public/park/schedules/upcoming`. Renders nothing when the park has nothing
 * scheduled, rather than showing an empty spine.
 */
export function UpcomingEvents({
  schedules,
}: {
  schedules: PublicUpcomingSchedule[];
}) {
  if (schedules.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Upcoming events
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          What&apos;s on next.
        </h2>
        <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
          Beach nights, cruises and family days — each one needs a park ticket
          for the same day, so add them to a trip you&apos;ve already booked.
        </p>
      </div>

      {/* A dated agenda read top to bottom: date chips on the spine, not the
          numbered circles used by "How it works". */}
      <ol className="mx-auto mt-14 max-w-3xl sm:mt-16">
        {schedules.map((schedule, i) => {
          const date = new Date(schedule.startAt);
          const month = date.toLocaleDateString("en-GB", { month: "short" });
          const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
          const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
          const time = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const isNext = i === 0;
          const soldOut = schedule.remaining <= 0;

          return (
            <li
              key={schedule.id}
              className="relative flex gap-5 pb-8 last:pb-0 sm:gap-6"
            >
              {i < schedules.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-16 bottom-0 left-7 w-px border-l border-dashed"
                />
              )}

              <span
                className={cn(
                  "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-card font-mono",
                  isNext && "border-amber-400/60 bg-amber-400/10",
                )}
              >
                <span className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                  {month}
                </span>
                <span
                  className={cn(
                    "text-lg leading-none font-semibold",
                    isNext && "text-amber-500 dark:text-amber-400",
                  )}
                >
                  {day}
                </span>
              </span>

              <div className="flex flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div>
                  <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                    {schedule.eventName}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                    {weekday} · {time} · {EVENT_TYPE_LABELS[schedule.eventType]}
                    {soldOut
                      ? " · Sold out"
                      : schedule.remaining <= 10
                        ? ` · ${schedule.remaining} left`
                        : ""}
                  </p>
                </div>
                <Link
                  to="/theme-park/events/$eventId"
                  params={{ eventId: String(schedule.eventId) }}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full border px-5 text-sm font-semibold transition-colors hover:bg-accent",
                    soldOut && "opacity-60",
                  )}
                >
                  {soldOut ? "View" : "Reserve"}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
