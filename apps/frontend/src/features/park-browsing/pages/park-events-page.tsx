import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, X } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { EventCard } from "../components/event-card";
import { EVENT_TYPE_LABELS, type ParkEventsSearch } from "../constants";
import { publicParkEventsQueryOptions } from "../queries";
import type { EventType, LocationType } from "../types";

const EVENT_TYPE_FILTERS: EventType[] = ["ride", "show", "beach_event"];
const LOCATION_FILTERS: { value: LocationType; label: string }[] = [
  { value: "theme_park", label: "Theme park" },
  { value: "beach", label: "Beach" },
];

function formatDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function ParkEventsPage({
  search,
  onSearchChange,
}: {
  search: ParkEventsSearch;
  onSearchChange: (next: ParkEventsSearch) => void;
}) {
  const { data: events } = useSuspenseQuery(
    publicParkEventsQueryOptions({
      eventType: search.eventType,
      locationType: search.locationType,
    }),
  );

  const hasFilters = search.eventType != null || search.locationType != null;

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">What&apos;s on</h1>
      <p className="mt-2 text-muted-foreground">
        {events.length} {events.length === 1 ? "experience" : "experiences"}{" "}
        across the theme park and the beach.
      </p>

      {search.date && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-series-park/30 bg-series-park/5 p-4">
          <CalendarCheck className="size-4 shrink-0 text-series-park" />
          <p className="flex-1 text-sm">
            Planning for{" "}
            <span className="font-medium">{formatDay(search.date)}</span>. Times
            on that day are marked{" "}
            <Badge variant="secondary">Your visit day</Badge> when you open an
            experience.
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
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        {LOCATION_FILTERS.map((loc) => (
          <Button
            key={loc.value}
            variant={search.locationType === loc.value ? "default" : "outline"}
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
          <p className="text-lg font-medium">Nothing matches those filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing them to see everything the island runs.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
            "items-stretch",
          )}
        >
          {events.map((event) => (
            <Link
              key={event.id}
              to="/theme-park/events/$eventId"
              params={{ eventId: String(event.id) }}
              search={search.date ? { date: search.date } : {}}
              className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <EventCard event={event} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
