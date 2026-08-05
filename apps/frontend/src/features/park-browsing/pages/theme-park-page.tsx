import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Ticket, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { EventCard } from "../components/event-card";
import { TicketTypeCard } from "../components/ticket-type-card";
import {
  EVENT_TYPE_LABELS,
  gbp,
  type ParkEventsSearch,
} from "../constants";
import {
  publicParkEventsQueryOptions,
  publicTicketTypesQueryOptions,
} from "../queries";
import type { EventType, LocationType } from "../types";

const EVENT_TYPE_FILTERS: EventType[] = ["ride", "show", "beach_event"];
const LOCATION_FILTERS: { value: LocationType; label: string }[] = [
  { value: "theme_park", label: "Theme park" },
  { value: "beach", label: "Beach" },
];

/**
 * The order is deliberate and it is the whole point of this page: show the
 * experiences first, explain the two-step model second, ask for money last.
 * Leading with ticket prices asked visitors to buy before they'd seen anything,
 * and buried the one thing that makes the model legible — entry admits you,
 * experiences are booked and paid for on top — at the very bottom.
 */
const STEPS = [
  {
    title: "Pick your day",
    body: "Choose the date you're visiting. Each day sells a limited number of tickets, so popular dates close early.",
  },
  {
    title: "Buy your entry",
    body: "One park ticket per person, per day. This is what admits you through the gate — nothing else does.",
  },
  {
    title: "Book your experiences",
    body: "Reserve rides, shows and beach events against that ticket, for the same day. Each is priced and paid for separately.",
  },
];

function formatDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function ThemeParkPage({
  search,
  onSearchChange,
}: {
  search: ParkEventsSearch;
  onSearchChange: (next: ParkEventsSearch) => void;
}) {
  const { data: ticketTypes } = useSuspenseQuery(publicTicketTypesQueryOptions);
  const { data: events } = useSuspenseQuery(
    publicParkEventsQueryOptions({
      eventType: search.eventType,
      locationType: search.locationType,
    }),
  );

  const hasFilters = search.eventType != null || search.locationType != null;
  const cheapestEntry = ticketTypes.reduce<number | null>(
    (min, t) => (min == null ? Number(t.price) : Math.min(min, Number(t.price))),
    null,
  );

  /** Toggling an active chip clears it — chips are filters, not radio buttons. */
  const toggle = <K extends "eventType" | "locationType">(
    key: K,
    value: ParkEventsSearch[K],
  ) =>
    onSearchChange({
      ...search,
      [key]: search[key] === value ? undefined : value,
    });

  return (
    <div>
      <section className="relative isolate flex min-h-[70svh] flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/card-ui-img/themepark.png"
            alt="The island theme park seen from the water at golden hour"
            className="size-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/25" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="animate-fade-in text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">
            Theme park &amp; beach
          </p>

          <h1 className="animate-fade-in mt-4 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-white sm:text-6xl">
            Rides, shows and{" "}
            <span className="font-serif font-bold italic">sunset sailings</span>
            , all in one day
          </h1>

          {/* The model, stated before a single price is shown. A visitor who
              misses this reads the tiers as all-inclusive and is surprised at
              the ride. */}
          <p className="animate-fade-in mt-5 max-w-xl text-base text-pretty text-white/75 sm:text-lg">
            Your park ticket admits you for the day you choose. Reserve the
            rides and events you want on top — each one books against that
            ticket.
          </p>

          {cheapestEntry != null && (
            <p className="animate-fade-in mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-white/70">
              <span className="text-series-park text-lg font-bold tabular-nums">
                Entry from {gbp(cheapestEntry)}
              </span>
              <span>per person, per day · experiences priced separately</span>
            </p>
          )}

          <div className="animate-fade-in mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#whats-on">
                See what&apos;s on
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
            >
              <Link to="/theme-park/tickets">
                <Ticket className="size-4" />
                Buy park tickets
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section id="whats-on" className="scroll-mt-20 sm:scroll-mt-24">
          <h2 className="text-3xl font-semibold tracking-tight">
            What&apos;s on
          </h2>
          <p className="text-muted-foreground mt-2">
            {events.length} {events.length === 1 ? "experience" : "experiences"}{" "}
            across the theme park and the beach. Booked against a park ticket
            for the same day.
          </p>

          {search.date && (
            <div className="border-series-park/30 bg-series-park/5 mt-6 flex flex-wrap items-center gap-3 rounded-lg border p-4">
              <CalendarCheck className="text-series-park size-4 shrink-0" />
              <p className="flex-1 text-sm">
                Planning for{" "}
                <span className="font-medium">{formatDay(search.date)}</span>.
                Times on that day are marked{" "}
                <Badge variant="secondary">Your visit day</Badge> when you open
                an experience.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange({ ...search, date: undefined })}
              >
                <X className="size-3.5" />
                Clear
              </Button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {EVENT_TYPE_FILTERS.map((type) => (
              <Button
                key={type}
                variant={search.eventType === type ? "default" : "outline"}
                size="sm"
                aria-pressed={search.eventType === type}
                onClick={() => toggle("eventType", type)}
              >
                {EVENT_TYPE_LABELS[type]}
              </Button>
            ))}
            <span className="bg-border mx-1 h-5 w-px" aria-hidden />
            {LOCATION_FILTERS.map((loc) => (
              <Button
                key={loc.value}
                variant={
                  search.locationType === loc.value ? "default" : "outline"
                }
                size="sm"
                aria-pressed={search.locationType === loc.value}
                onClick={() => toggle("locationType", loc.value)}
              >
                {loc.label}
              </Button>
            ))}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onSearchChange({
                    date: search.date,
                    eventType: undefined,
                    locationType: undefined,
                  })
                }
              >
                <X className="size-3.5" />
                Clear filters
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <div className="glass-data mt-8 rounded-xl border p-12 text-center">
              <p className="text-lg font-medium">
                Nothing matches those filters.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try clearing them to see everything the island runs.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to="/theme-park/events/$eventId"
                  params={{ eventId: String(event.id) }}
                  search={search.date ? { date: search.date } : {}}
                  className="focus-visible:ring-ring block rounded-3xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <EventCard event={event} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold tracking-tight">
            How a park day works
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Entry and experiences are two separate purchases, in that order.
          </p>

          {/* Numbered because this genuinely is a sequence with a hard
              prerequisite — you cannot book an experience without already
              holding a ticket for that day. */}
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex flex-col gap-3">
                <span className="flex items-center gap-3">
                  <span className="bg-series-park/15 text-series-park flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="bg-border hidden h-px flex-1 sm:block"
                    />
                  )}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm text-pretty">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-semibold tracking-tight">
            Park tickets
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            One per person, per day. Entry to the park and the beach is
            included; rides, shows and events are booked separately once
            you&apos;re in.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {ticketTypes.map((type) => (
              <TicketTypeCard key={type.id} ticketType={type} />
            ))}
          </div>

          <Button asChild size="lg" className="mt-8">
            <Link to="/theme-park/tickets">
              Choose your date
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
