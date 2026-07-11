import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { IslandMapCanvas } from "../components/island-map-canvas";
import {
  LOCATION_TYPES,
  LOCATION_TYPE_COLORS,
  LOCATION_TYPE_LABELS,
  type MapSearch,
} from "../constants";
import { mapLocationsQueryOptions, publicHotelPinsQueryOptions } from "../queries";
import type { LocationType, MapLocation } from "../types";

/** Matches a `hotel`-type location to its hotel id by comparing pin position. */
function hotelIdFor(
  loc: MapLocation,
  pins: { id: number; positionTop: string | null; positionLeft: string | null }[],
): number | undefined {
  const top = Number(loc.positionTop);
  const left = Number(loc.positionLeft);
  return pins.find(
    (p) =>
      p.positionTop != null &&
      p.positionLeft != null &&
      Number(p.positionTop) === top &&
      Number(p.positionLeft) === left,
  )?.id;
}

export function IslandMapPage({
  search,
  onTypeChange,
}: {
  search: MapSearch;
  onTypeChange: (type: LocationType | undefined) => void;
}) {
  const { data: locations } = useSuspenseQuery(mapLocationsQueryOptions);
  const { data: hotelPins } = useSuspenseQuery(publicHotelPinsQueryOptions);

  const filtered = useMemo(
    () =>
      search.type ? locations.filter((l) => l.type === search.type) : locations,
    [locations, search.type],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Island map</h1>
        <p className="text-sm text-muted-foreground">
          Explore hotels, ferries, attractions, and more around the island.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={search.type == null ? "default" : "outline"}
          onClick={() => onTypeChange(undefined)}
        >
          All
        </Button>
        {LOCATION_TYPES.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={search.type === t ? "default" : "outline"}
            onClick={() => onTypeChange(search.type === t ? undefined : t)}
          >
            <span
              className="mr-1.5 size-2 rounded-full"
              style={{ backgroundColor: LOCATION_TYPE_COLORS[t] }}
            />
            {LOCATION_TYPE_LABELS[t]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IslandMapCanvas
            locations={filtered}
            showLegend
            renderPopoverExtra={(loc) => {
              if (loc.type !== "hotel") return null;
              const hotelId = hotelIdFor(loc, hotelPins);
              if (!hotelId) return null;
              return (
                <Button asChild size="sm" className="w-full">
                  <Link to="/hotels/$hotelId" params={{ hotelId: String(hotelId) }}>
                    View hotel
                  </Link>
                </Button>
              );
            }}
          />
        </div>

        <div className="flex max-h-150 flex-col gap-2 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No locations match this filter.
            </p>
          ) : (
            filtered.map((loc) => {
              const hotelId = loc.type === "hotel" ? hotelIdFor(loc, hotelPins) : undefined;
              const content = (
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: LOCATION_TYPE_COLORS[loc.type] }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {loc.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {loc.description}
                    </span>
                  </div>
                  <Badge variant="outline">{LOCATION_TYPE_LABELS[loc.type]}</Badge>
                </div>
              );
              return hotelId ? (
                <Link
                  key={loc.id}
                  to="/hotels/$hotelId"
                  params={{ hotelId: String(hotelId) }}
                  className="transition-opacity hover:opacity-80"
                >
                  {content}
                </Link>
              ) : (
                <div key={loc.id}>{content}</div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <Button asChild variant="outline">
          <Link
            to="/hotels"
            search={{ minPrice: search.minPrice, maxPrice: search.maxPrice, guests: search.guests }}
          >
            View filtered results as a list
          </Link>
        </Button>
      </div>
    </div>
  );
}
