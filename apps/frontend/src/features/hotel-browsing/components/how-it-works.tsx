import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

const STEPS = [
  {
    title: "Book Your Hotel",
    body: "Choose your dates and room type. This becomes your trip reference.",
  },
  {
    title: "Reserve Ferry Tickets",
    body: "Crossings attach to your stay, so your seat is held with the room.",
  },
  {
    title: "Purchase Theme Park Tickets",
    body: "Dated park entry, plus seats at the shows that need one.",
  },
  {
    title: "Enjoy Your Island Adventure",
    body: "One reference for the lot. Just turn up at the jetty.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            How it works
          </p>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            From booking to boarding.
          </h2>
          <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
            Each step builds on the one before it — your crossing needs a room,
            beach events need a park ticket. It all lands on one reference.
          </p>
        </div>

        {/* Stops on a route: a dashed connector is how an itinerary is drawn on
            a map, and the numbers are a real dependency chain, not decoration. */}
        <ol className="mx-auto mt-16 grid max-w-5xl gap-10 sm:mt-20 lg:grid-cols-4 lg:gap-8">
          {STEPS.map(({ title, body }, i) => {
            const isLast = i === STEPS.length - 1;

            return (
              <li
                key={title}
                className="relative flex gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
              >
                {!isLast && (
                  <>
                    <span
                      aria-hidden
                      className="absolute top-12 -bottom-8 left-[1.375rem] flex flex-col items-center lg:hidden"
                    >
                      <span className="w-px flex-1 border-l border-dashed" />
                      <ChevronDown className="-mt-1 size-3.5 shrink-0 text-muted-foreground/60" />
                    </span>
                    <span
                      aria-hidden
                      className="absolute top-[1.375rem] right-[calc(-50%-0.25rem)] left-[calc(50%+1.75rem)] hidden items-center lg:flex"
                    >
                      <span className="flex-1 border-t border-dashed" />
                      <ChevronRight className="-ml-1 size-3.5 shrink-0 text-muted-foreground/60" />
                    </span>
                  </>
                )}

                <span
                  className={cn(
                    "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background font-mono text-sm font-semibold",
                    isLast &&
                      "border-amber-400/60 bg-amber-400/10 text-amber-400",
                  )}
                >
                  {i + 1}
                </span>

                <div className="lg:mt-6">
                  <h3 className="text-base font-semibold tracking-tight text-balance sm:text-lg">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-pretty text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
