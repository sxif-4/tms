import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

/** Mock schedule for now — the park's events live in the events domain. */
const EVENTS = [
  {
    month: "Aug",
    day: "04",
    weekday: "Tuesday",
    title: "Fireworks Show",
  },
  {
    month: "Aug",
    day: "08",
    weekday: "Saturday",
    title: "Beach Music Festival",
  },
  {
    month: "Aug",
    day: "10",
    weekday: "Monday",
    title: "Kids Adventure Day",
  },
];

export function UpcomingEvents() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Upcoming events
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          What's on this month.
        </h2>
        <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
          Beach nights, fireworks, and family days — each one needs a park
          ticket, so add them to a trip you've already booked.
        </p>
      </div>

      {/* A dated agenda read top to bottom: date chips on the spine, not the
          numbered circles used by "How it works". */}
      <ol className="mx-auto mt-14 max-w-3xl sm:mt-16">
        {EVENTS.map(({ month, day, weekday, title }, i) => {
          const isNext = i === 0;

          return (
            <li
              key={title}
              className="relative flex gap-5 pb-8 last:pb-0 sm:gap-6"
            >
              {i < EVENTS.length - 1 && (
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
                    {title}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                    {weekday}
                  </p>
                </div>
                <Link
                  to="/theme-park"
                  className="inline-flex h-9 shrink-0 items-center rounded-full border px-5 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Reserve
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
