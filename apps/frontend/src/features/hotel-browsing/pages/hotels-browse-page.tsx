import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Map, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { cn } from "~/lib/utils";
import { HotelCard } from "../components/hotel-card";
import { HOTELS_HERO_IMAGE, type HotelSearch } from "../constants";
import { publicHotelsQueryOptions } from "../queries";

const DEFAULT_MAX = 500;
const MIN_PRICE = 50;
const GUEST_OPTIONS = [1, 2, 3, 4];

export function HotelsBrowsePage({
  search,
  onSearchChange,
}: {
  search: HotelSearch;
  onSearchChange: (next: Partial<HotelSearch>) => void;
}) {
  /*
   * Guest count filters on the API, so every click is a round trip and the
   * query key changes. Under `useSuspenseQuery` that unmounted the whole page
   * to the nearest fallback on each tick — which read as the page reloading.
   * Keeping the previous results means the grid dims in place instead.
   */
  const {
    data: hotels = [],
    isFetching,
    isPending,
  } = useQuery({
    ...publicHotelsQueryOptions({ guests: search.guests }),
    placeholderData: keepPreviousData,
  });

  const maxPrice = search.maxPrice ?? DEFAULT_MAX;
  const [draftMax, setDraftMax] = useState(maxPrice);
  useEffect(() => {
    setDraftMax(maxPrice);
  }, [maxPrice]);

  const hasFilters = search.maxPrice != null || search.guests != null;

  // Price is filtered here rather than on the API so dragging the slider
  // updates the grid live, without a request per step.
  const visibleHotels = hotels.filter(
    (hotel) => hotel.minPrice == null || hotel.minPrice <= draftMax,
  );

  const clearFilters = () =>
    onSearchChange({
      minPrice: undefined,
      maxPrice: undefined,
      guests: undefined,
    });

  return (
    <div>
      <section className="relative isolate flex min-h-[38vh] items-end overflow-hidden">
        <img
          src={HOTELS_HERO_IMAGE}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/50 to-black/25" />
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
            Where to stay
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Island hotels
          </h1>
          <p className="mt-4 max-w-xl text-base text-pretty text-white/80 sm:text-lg">
            Beachfront villas, overwater suites and dive lodges — every one a
            short ferry from the park.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  <SlidersHorizontal className="size-4" />
                  Filters
                </h2>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="size-3" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <Label className="text-sm font-medium">Max price</Label>
                    <span className="text-sm font-semibold tabular-nums">
                      £{draftMax}
                      <span className="font-normal text-muted-foreground">
                        /night
                      </span>
                    </span>
                  </div>
                  <Slider
                    aria-label="Maximum price per night"
                    value={[draftMax]}
                    min={MIN_PRICE}
                    max={DEFAULT_MAX}
                    step={10}
                    onValueChange={(v) => setDraftMax(v[0])}
                    onValueCommit={(v) =>
                      onSearchChange({
                        maxPrice: v[0] === DEFAULT_MAX ? undefined : v[0],
                      })
                    }
                  />
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>£{MIN_PRICE}</span>
                    <span>£{DEFAULT_MAX}+</span>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Label className="text-sm font-medium">Guests</Label>
                  {/*
                   * These were checkboxes bound to `guests === n`, so ticking one
                   * silently unticked the others — checkbox chrome on radio
                   * behaviour. Toggle pills say what they do: one at a time, and
                   * clicking the active one clears it.
                   */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {GUEST_OPTIONS.map((n) => {
                      const active = search.guests === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={active}
                          aria-label={`${n} or more guests`}
                          onClick={() =>
                            onSearchChange({ guests: active ? undefined : n })
                          }
                          className={cn(
                            "min-w-12 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            active
                              ? "border-transparent bg-brand text-brand-foreground"
                              : "text-muted-foreground hover:border-brand/40 hover:text-foreground",
                          )}
                        >
                          {n}+
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {visibleHotels.length}{" "}
                {visibleHotels.length === 1 ? "stay" : "stays"} available
                {isFetching && (
                  <span className="ml-2 opacity-70">Updating…</span>
                )}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/map" search={search}>
                  <Map className="size-4" />
                  View on map
                </Link>
              </Button>
            </div>

            {isPending ? (
              // The route loader normally warms this, so it's a safety net
              // rather than the usual path — but never claim "no results"
              // while the first request is still in flight.
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="min-h-112 rounded-[28px] sm:min-h-128"
                  />
                ))}
              </div>
            ) : visibleHotels.length === 0 ? (
              <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
                <p className="text-lg font-medium">
                  No stays match these filters
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try raising the price cap or asking for fewer guests.
                </p>
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "grid gap-6 transition-opacity md:grid-cols-2",
                  isFetching && "opacity-60",
                )}
              >
                {visibleHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
