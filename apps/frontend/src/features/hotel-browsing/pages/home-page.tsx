import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "~/components/ui/button";
import { activeAdvertisementsQueryOptions } from "~/features/advertisements/queries";
import { publicHotelsQueryOptions } from "~/features/hotel-browsing/queries";
import {
  publicParkEventsQueryOptions,
  upcomingParkSchedulesQueryOptions,
} from "~/features/park-browsing/queries";
import { WhyChooseUs } from "~/features/hotel-browsing/components/why-choose-us";
import { HowItWorks } from "~/features/hotel-browsing/components/how-it-works";
import { ThemeParkExperiences } from "~/features/hotel-browsing/components/theme-park-experiences";
import { PromoBanner } from "~/features/hotel-browsing/components/promo-banner";
import { UpcomingEvents } from "~/features/hotel-browsing/components/upcoming-events";
import { FeaturedStays } from "~/features/hotel-browsing/components/featured-stays";

/** How many upcoming runs the homepage agenda lists. */
const HOMEPAGE_AGENDA_SIZE = 3;

const PARTNER_LOGOS = [
  { src: "/logos/skyscanner-logo.svg", alt: "Skyscanner" },
  { src: "/logos/expedia-logo.svg", alt: "Expedia" },
  { src: "/logos/tripadvisor-logo.svg", alt: "Tripadvisor" },
  { src: "/logos/conde-nast-traveler-logo.svg", alt: "Condé Nast Traveler" },
  { src: "/logos/cnn-logo.svg", alt: "CNN" },
  { src: "/logos/bbc-logo.svg", alt: "BBC" },
];

export function HomePage() {
  const { data: ads } = useSuspenseQuery(
    activeAdvertisementsQueryOptions("homepage"),
  );
  const { data: hotels } = useSuspenseQuery(publicHotelsQueryOptions());
  const { data: parkEvents } = useSuspenseQuery(publicParkEventsQueryOptions());
  const { data: upcoming } = useSuspenseQuery(
    upcomingParkSchedulesQueryOptions(HOMEPAGE_AGENDA_SIZE),
  );

  // The carousel is headlined "theme park experiences" — beach events get
  // their own billing on /theme-park rather than being folded in here.
  const attractions = parkEvents.filter(
    (event) => event.locationType === "theme_park",
  );

  return (
    <div>
      <section className="relative isolate flex min-h-svh flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/hero/skyhero.png"
            alt="The island resort lit up at night"
            className="size-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
          {/* <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/75" />
          <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/10 to-transparent" /> */}
        </div>

        {/* Top padding clears the fixed navbar (h-16 / sm:h-20) plus a 10px gap. */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col pt-30">
          <div className="flex flex-1 flex-col items-center px-4 pb-12 text-center sm:px-6">
            <div className="animate-fade-in flex items-center gap-2.5">
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </span>
              <span className="text-xs font-medium text-white/80 sm:text-sm">
                Loved by 10,000+ island guests
              </span>
            </div>

            <h1 className="animate-fade-in  max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
              The best place to find your{" "}
              <span className="italic">Island Escape</span>
            </h1>

            <p className="animate-fade-in mt-5 max-w-xl text-base text-pretty text-white/80 sm:text-lg">
              Stay, sail, and play across the island hotels, ferries, theme-park
              days, and beach events in a single booking.
            </p>

            <Button
              asChild
              className="animate-fade-in mt-8 h-11 rounded-md bg-primary px-8 text-base font-semibold text-primary-foreground hover:bg-primary/80 sm:mt-10"
            >
              <Link to="/hotels">Explore</Link>
            </Button>
          </div>
        </div>

        {/* Full-bleed partner strip: it runs edge to edge along the bottom of
            the hero image rather than sitting inside the 7xl content column. */}
        <div className="w-full border-t border-white/10 bg-black">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-5 sm:justify-between sm:gap-x-12 sm:px-6 lg:px-8">
            <span className="flex items-center gap-3 text-xs font-medium whitespace-nowrap text-white/60 sm:text-sm">
              As featured in
              <span className="h-4 w-px bg-white/20" aria-hidden="true" />
            </span>
            {PARTNER_LOGOS.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-5 w-auto opacity-80 brightness-0 invert transition-opacity hover:opacity-100 sm:h-6"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUs />

      <FeaturedStays hotels={hotels} />

      <HowItWorks />

      <ThemeParkExperiences events={attractions} />

      <PromoBanner ads={ads} />

      <UpcomingEvents schedules={upcoming} />
    </div>
  );
}
