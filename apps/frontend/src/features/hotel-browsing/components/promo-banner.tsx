import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "~/components/ui/carousel";
import type { Advertisement } from "~/features/advertisements/types";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";

/** How long each creative holds before the carousel advances. */
const AUTOPLAY_MS = 6000;

/**
 * The homepage promo slider, driven by advertisements the admin uploads
 * (placement `homepage`, within their run dates). Renders nothing when no ad
 * is live, so the page closes up rather than showing an empty frame.
 */
export function PromoBanner({ ads }: { ads: Advertisement[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  // Embla owns the scroll position; mirror it so the dots stay in sync whether
  // the move came from a dot, an arrow, a swipe, or the autoplay timer.
  useEffect(() => {
    if (!api) return;
    const sync = () => setActive(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    return () => {
      api.off("select", sync);
    };
  }, [api]);

  useEffect(() => {
    if (!api || ads.length < 2) return;
    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [api, ads.length]);

  if (ads.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Carousel
        setApi={setApi}
        opts={{ loop: ads.length > 1 }}
        className="relative isolate overflow-hidden rounded-3xl border"
        aria-label="Current offers"
      >
        <CarouselContent className="ml-0">
          {ads.map((ad, i) => (
            <CarouselItem key={ad.id} className="pl-0">
              <a
                href={ad.targetUrl}
                tabIndex={i === active ? undefined : -1}
                className="relative flex min-h-96 flex-col justify-center p-8 pb-24 sm:min-h-104 sm:p-12 sm:pb-24 lg:min-h-120 lg:p-16 lg:pb-24"
              >
                <img
                  src={imageUrl(ad.image)}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 -z-10 size-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                {/* Content is vertically centred on the left, so the tint runs
                    left-to-right and the right of the photo stays clean. */}
                <span className="absolute inset-0 -z-10 bg-linear-to-r from-black/85 via-black/55 to-transparent" />

                <div className="max-w-lg">
                  <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-white/70 uppercase">
                    Featured offer
                  </p>
                  <p className="mt-4 font-serif text-3xl leading-tight font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl">
                    {ad.title}
                  </p>
                  <span className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-7 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white/90">
                    Book now
                  </span>
                </div>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>

        {ads.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-8 sm:p-12 sm:pb-10 lg:px-16">
            <div className="flex items-center gap-2">
              {ads.map((ad, i) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Show offer ${i + 1}: ${ad.title}`}
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
                onClick={() => api?.scrollPrev()}
                aria-label="Previous offer"
                className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => api?.scrollNext()}
                aria-label="Next offer"
                className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Carousel>
    </section>
  );
}
