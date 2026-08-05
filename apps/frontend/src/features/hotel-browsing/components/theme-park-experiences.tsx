import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { EVENT_TYPE_LABELS } from "~/features/park-browsing/constants";
import type { PublicEvent } from "~/features/park-browsing/types";
import { cn } from "~/lib/utils";

/**
 * Events carry no images yet — `imageables` would support them, but nothing
 * uploads event photos. These island shots stand in, picked deterministically
 * by event id so a given attraction always shows the same art.
 */
const ARTWORK = [
  "/images/hero/hero-island-resort.jpg",
  "/images/hotels/hotel-jungle-lodge.jpg",
  "/images/hotels/hotel-seaside-resort.jpg",
  "/images/hotels/hotel-cliffside.jpg",
  "/images/hero/hero-island.jpg",
];

const artworkFor = (eventId: number) => ARTWORK[eventId % ARTWORK.length];

export function ThemeParkExperiences({ events }: { events: PublicEvent[] }) {
  /** Middle index — the track sits at translate 0 when this card is active. */
  const mid = (events.length - 1) / 2;
  const [active, setActive] = useState(Math.round(mid));

  if (events.length === 0) return null;

  const last = events.length - 1;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
          Featured theme park experiences
        </p>
        <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Come for the rides,{" "}
          <span className="text-amber-500 dark:text-amber-400">
            stay for the view.
          </span>
        </h2>
        <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
          The park&apos;s headline attractions. One dated ticket gets you in —
          then reserve the ones you don&apos;t want to miss.
        </p>
      </div>

      {/* Card width and gap live in CSS variables so the track can shift by
          exactly one card per step without measuring anything in JS. */}
      <div className="relative mt-14 [--cw:9rem] [--gap:0.75rem] sm:mt-16 sm:[--cw:11rem] sm:[--gap:1rem] lg:[--cw:13rem] lg:[--gap:1.25rem]">
        <div className="overflow-hidden py-6 mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div
            className="flex justify-center gap-[var(--gap)] transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{
              transform: `translateX(calc(${mid - active} * (var(--cw) + var(--gap))))`,
            }}
          >
            {events.map((event, i) => {
              const dist = Math.abs(i - active);
              const isActive = dist === 0;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "w-[var(--cw)] shrink-0 text-center transition-opacity duration-500 ease-out motion-reduce:transition-none",
                    dist === 0
                      ? "opacity-100"
                      : dist === 1
                        ? "opacity-65"
                        : "opacity-30",
                  )}
                >
                  {/* Only the art scales — captions stay a consistent size so
                      the outer ones remain readable. */}
                  <div
                    className={cn(
                      "relative aspect-3/4 overflow-hidden rounded-2xl transition-transform duration-500 ease-out motion-reduce:transition-none",
                      dist === 0
                        ? "scale-100"
                        : dist === 1
                          ? "scale-90"
                          : "scale-82",
                    )}
                  >
                    <img
                      src={artworkFor(event.id)}
                      alt=""
                      aria-hidden
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <p className="mt-4 font-serif text-sm font-semibold italic sm:text-base">
                    {event.name}
                  </p>
                  <p
                    className={cn(
                      "mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-500 motion-reduce:transition-none",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActive((v) => Math.max(0, v - 1))}
          disabled={active === 0}
          aria-label="Previous experience"
          className="absolute top-[42%] left-0 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/80 backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setActive((v) => Math.min(last, v + 1))}
          disabled={active === last}
          aria-label="Next experience"
          className="absolute top-[42%] right-0 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/80 backdrop-blur-sm transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link
          to="/theme-park/events/$eventId"
          params={{ eventId: String(events[active]?.id ?? events[0].id) }}
          className="inline-flex h-11 items-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors hover:bg-accent"
        >
          See {events[active]?.name ?? "this experience"}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          to="/theme-park"
          className="inline-flex h-11 items-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors hover:bg-accent"
        >
          Explore the theme park
        </Link>
      </div>
    </section>
  );
}
