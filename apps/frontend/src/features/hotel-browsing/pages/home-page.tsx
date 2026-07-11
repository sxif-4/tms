import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Hotel, Map, Palmtree, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { activeAdvertisementsQueryOptions } from "~/features/advertisements/queries";
import { HotelCard } from "~/features/hotel-browsing/components/hotel-card";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";

export function HomePage() {
  const { data: ads } = useSuspenseQuery(activeAdvertisementsQueryOptions("homepage"));
  const { data: hotels } = useSuspenseQuery(publicHotelsQueryOptions());

  return (
    <div>
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/hero/hero-island.jpg"
            alt="Aerial view of the island at golden hour"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="glass-marketing-strong max-w-2xl rounded-2xl p-8 sm:p-10">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-sm">
              <Sparkles className="size-3.5" />
              Now booking for 2026
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
              Welcome to the island
            </h1>
            <p className="mt-4 text-lg text-muted-foreground text-balance">
              Overwater villas, rainforest lodges, and cliffside suites — book
              your perfect getaway today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/hotels">
                  Explore hotels
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/map">View island map</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {ads.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {ads.map((ad) => (
              <Link
                key={ad.id}
                to={ad.targetUrl.startsWith("/") ? ad.targetUrl : "/hotels"}
                className="group relative min-w-[280px] max-w-sm flex-1 overflow-hidden rounded-xl border"
              >
                <div className="relative aspect-video w-full">
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-semibold">{ad.title}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      View offer
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">What to do here</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Hotel, title: "Island hotels", link: "/hotels", cta: "Browse hotels" },
            { icon: Palmtree, title: "Theme park", link: "/theme-park", cta: "Coming soon" },
            { icon: Map, title: "Island map", link: "/map", cta: "Explore map" },
          ].map(({ icon: Icon, title, link, cta }) => (
            <Link
              key={title}
              to={link}
              className="glass-data group rounded-2xl border p-6 transition-transform hover:-translate-y-1"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-6" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {hotels.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Featured stays</h2>
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
            {hotels.slice(0, 3).map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
