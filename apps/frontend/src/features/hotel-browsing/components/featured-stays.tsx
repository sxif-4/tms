import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { HotelCard } from "~/features/hotel-browsing/components/hotel-card";
import type { HotelSummary } from "~/features/hotel-browsing/types";

/** How many hotels the homepage teaser shows before sending guests to /hotels. */
const FEATURED_COUNT = 3;

/**
 * Homepage teaser for the hotel catalogue. Renders nothing when there are no
 * hotels to show, rather than an empty section.
 */
export function FeaturedStays({ hotels }: { hotels: HotelSummary[] }) {
  if (hotels.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 pb-20 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Featured stays
          </h2>
          <p className="mt-2 text-muted-foreground">
            Hand-picked properties across the island.
          </p>
        </div>
        <Button asChild variant="ghost" className="hidden sm:inline-flex">
          <Link to="/hotels">
            View all
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {hotels.slice(0, FEATURED_COUNT).map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    </section>
  );
}
