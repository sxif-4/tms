import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

/**
 * Mock copy for now. The app already serves real promotions — see
 * `activeAdvertisementsQueryOptions` and the promotions dashboards — so this
 * should read from that feed once the public endpoint is settled.
 */
const OFFERS = [
  {
    kicker: "Stay 3 Nights",
    line: "Get Theme Park Entry",
    value: "20% Off",
    image: "/images/card-ui-img/themepark.png",
  },
  {
    kicker: "Family Package",
    line: "Hotel + Ferry + Theme Park",
    value: "Save 15%",
    image: "/images/hotels/hotel-grand-island.jpg",
  },
];

export function PromoBanner() {
  const [active, setActive] = useState(0);
  const last = OFFERS.length - 1;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div
        className="relative isolate overflow-hidden rounded-3xl border"
        aria-roledescription="carousel"
        aria-label="Current offers"
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {OFFERS.map(({ kicker, line, value, image }, i) => {
            const isActive = i === active;

            return (
              <div
                key={kicker}
                aria-hidden={!isActive}
                className="relative flex min-h-96 w-full shrink-0 flex-col justify-center p-8 pb-24 sm:min-h-104 sm:p-12 sm:pb-24 lg:min-h-120 lg:p-16 lg:pb-24"
              >
                <img
                  src={image}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 -z-10 size-full object-cover"
                  loading="lazy"
                />
                {/* Content is vertically centred on the left, so the tint runs
                    left-to-right and the right of the photo stays clean. */}
                <span className="absolute inset-0 -z-10 bg-linear-to-r from-black/85 via-black/55 to-transparent" />

                <div className="max-w-lg">
                  <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-white/70 uppercase">
                    {kicker}
                  </p>
                  <p className="mt-4 font-serif text-3xl leading-tight font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
                    {line}
                  </p>
                  <p className="mt-1 font-serif text-3xl leading-tight font-bold tracking-tight text-amber-400 sm:text-4xl lg:text-5xl">
                    {value}
                  </p>
                  <Link
                    to="/hotels"
                    tabIndex={isActive ? undefined : -1}
                    className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white/90"
                  >
                    Book now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-8 sm:p-12 sm:pb-10 lg:px-16">
          <div className="flex items-center gap-2">
            {OFFERS.map(({ kicker }, i) => (
              <button
                key={kicker}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show offer ${i + 1}: ${kicker}`}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                  i === active ? "w-8 bg-white" : "w-1.5 bg-white/40",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActive((v) => Math.max(0, v - 1))}
              disabled={active === 0}
              aria-label="Previous offer"
              className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setActive((v) => Math.min(last, v + 1))}
              disabled={active === last}
              aria-label="Next offer"
              className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
