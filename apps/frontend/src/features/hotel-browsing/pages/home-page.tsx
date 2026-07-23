import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Hotel,
  Map,
  Palmtree,
  Ship,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { meQueryOptions } from "~/features/auth/queries";
import { activeAdvertisementsQueryOptions } from "~/features/advertisements/queries";
import { HotelCard } from "~/features/hotel-browsing/components/hotel-card";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";
import { cn } from "~/lib/utils";

export function HomePage() {
  const navigate = useNavigate();
  const { data: ads } = useSuspenseQuery(
    activeAdvertisementsQueryOptions("homepage"),
  );
  const { data: hotels } = useSuspenseQuery(publicHotelsQueryOptions());
  const { data: user } = useQuery(meQueryOptions);
  const [guests, setGuests] = useState<string>("2");

  return (
    <div>
      <section className="relative">
        <div className="absolute inset-0 ">
          <img
            src="images/hero/hero-island.jpg"
            alt="Aerial view of the island at golden hour"
            className="hero-ken-burns size-full object-cover"
          />
          <div className="absolute inset-0 dark:bg-gradient-to-b from-background/20 via-background/30 to-background" />
        </div>

        <div className="mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:min-h-[85vh] sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <div className="animate-fade-in max-w-2xl drop-shadow-md">
            <p className="text-sm font-semibold tracking-[0.2em] text-white/90 uppercase">
              Island Booking
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
              Your lagoon escape starts here
            </h1>
            <p className="mt-4 max-w-xl text-lg text-pretty text-white/85">
              Book overwater villas, beach retreats, and cliffside suites across
              the atoll.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/hotels">
                  Explore hotels
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/map">View island map</Link>
              </Button>
              {user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link to="/my-bookings">My bookings</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:px-6 lg:px-8">
          <div className="flex-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Find a stay
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose guests, then browse hotels that fit.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40 space-y-1.5">
              <label
                htmlFor="home-guests"
                className="text-xs font-medium text-muted-foreground"
              >
                Guests
              </label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger id="home-guests" className="w-full">
                  <Users className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}+ guests
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              onClick={() =>
                void navigate({
                  to: "/hotels",
                  search: { guests: Number(guests) },
                })
              }
            >
              Find stays
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {ads.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold tracking-tight">Offers</h2>
            <p className="mt-2 text-muted-foreground">
              Current promotions for your next island stay.
            </p>
          </div>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-semibold text-white">{ad.title}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white/90">
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
            {hotels.slice(0, 3).map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
