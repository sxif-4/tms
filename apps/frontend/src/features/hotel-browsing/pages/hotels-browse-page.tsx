import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
import { HotelCard } from "../components/hotel-card";
import type { HotelSearch } from "../constants";
import { publicHotelsQueryOptions } from "../queries";
import { useState, useEffect } from "react";


const DEFAULT_MAX = 500;

export function HotelsBrowsePage({
  search,
  onSearchChange,
}: {
  search: HotelSearch;
  onSearchChange: (next: Partial<HotelSearch>) => void;
}) {
  const filters = {
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    guests: search.guests,
  };
  const { data: hotels } = useSuspenseQuery(publicHotelsQueryOptions(filters));

  const maxPrice = search.maxPrice ?? DEFAULT_MAX;
  const [draftMax, setDraftMax] = useState(maxPrice);
  useEffect(() => {
    setDraftMax(maxPrice);
  }, [maxPrice]);
  const hasFilters =
    search.minPrice != null ||
    search.maxPrice != null ||
    search.guests != null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Island hotels</h1>
          <p className="mt-2 text-muted-foreground">
            {hotels.length} {hotels.length === 1 ? "stay" : "stays"} available
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/map" search={search}>
            View on map
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="glass-marketing rounded-xl border p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="size-4" />
                Filters
              </h2>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onSearchChange({
                      minPrice: undefined,
                      maxPrice: undefined,
                      guests: undefined,
                    })
                  }
                >
                  <X className="size-3" />
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-sm font-medium">
                  Max price: £{draftMax}/night
                </Label>
                <Slider
                  value={[draftMax]}
                  min={50}
                  max={DEFAULT_MAX}
                  step={10}
                  onValueChange={(v) => setDraftMax(v[0])}
                  onValueCommit={(v) => 
                    onSearchChange({
                      maxPrice: v[0] === DEFAULT_MAX ? undefined : v[0],
                    })
                  }
                />
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block text-sm font-medium">Guests</Label>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <Checkbox
                        id={`guests-${n}`}
                        checked={search.guests === n}
                        onCheckedChange={(checked) =>
                          onSearchChange({ guests: checked ? n : undefined })
                        }
                      />
                      <Label htmlFor={`guests-${n}`} className="cursor-pointer font-normal">
                        {n}+ guests
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div>
          {hotels.length === 0 ? (
            <div className="glass-data rounded-xl border p-12 text-center">
              <p className="text-lg font-medium">No hotels match your filters.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  onSearchChange({
                    minPrice: undefined,
                    maxPrice: undefined,
                    guests: undefined,
                  })
                }
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
