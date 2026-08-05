import { FerrisWheel, Palmtree, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import { EVENT_TYPE_LABELS, gbp } from "../constants";
import type { EventType, PublicEvent } from "../types";

/**
 * Stands in for the photo until staff upload one. Sized large and set at low
 * opacity behind the gradient, so an unphotographed ride still reads as a
 * poster rather than a broken image.
 */
const EVENT_ICONS: Record<EventType, LucideIcon> = {
  ride: FerrisWheel,
  show: Sparkles,
  beach_event: Palmtree,
};

/**
 * A ride, show or beach event as a poster: photo first, name and price over a
 * gradient, nothing else. It borrows the hotel card's full-bleed treatment
 * because both sell a place you haven't seen — but stays a taller, lighter
 * frame with an italic title, since an event is a moment rather than a stay.
 *
 * Deliberately link-free: both grids that use it wrap the whole card in one.
 */
export function EventCard({
  event,
  className,
}: {
  event: PublicEvent;
  className?: string;
}) {
  const Icon = EVENT_ICONS[event.eventType];

  return (
    <article
      className={cn(
        "group relative isolate flex aspect-4/5 flex-col justify-end overflow-hidden rounded-3xl",
        "bg-muted shadow-lg shadow-black/15 ring-1 ring-white/10",
        className,
      )}
    >
      {event.image ? (
        <img
          src={imageUrl(event.image)}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-series-park/25 to-series-park/5">
          <Icon
            className="size-28 text-series-park/35 transition-transform duration-700 ease-out group-hover:scale-105"
            aria-hidden
          />
        </div>
      )}

      {/* Carries the title's contrast — strongest exactly where the text sits. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent"
      />

      <span className="absolute top-4 left-4 z-10 inline-flex items-center rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md">
        {EVENT_TYPE_LABELS[event.eventType]}
      </span>

      <div className="relative z-10 flex flex-col gap-1 p-5">
        <h3 className="font-serif text-2xl leading-tight font-bold text-balance text-white italic">
          {event.name}
        </h3>
        <p className="flex items-baseline gap-1.5">
          <span className="text-base font-semibold text-white tabular-nums">
            {gbp(Number(event.basePrice))}
          </span>
          <span className="text-xs text-white/65">per person</span>
        </p>
      </div>
    </article>
  );
}
