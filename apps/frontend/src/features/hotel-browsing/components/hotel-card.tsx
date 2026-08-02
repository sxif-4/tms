import { Link } from "@tanstack/react-router";
import { Heart, Images, MapPin } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { gbp, hotelImage } from "../constants";
import type { HotelSummary } from "../types";
import { imageUrl } from "~/lib/image-url";

export function HotelCard({ hotel }: { hotel: HotelSummary }) {
  // Presentational only — there is no favourites endpoint yet.
  const [saved, setSaved] = useState(false);

  const onMap = Boolean(hotel.positionTop || hotel.positionLeft);
  const photoCount = hotel.imageCount ?? 0;
  const hotelParams = { hotelId: String(hotel.id) };

  return (
    <article className="group relative isolate flex min-h-112 flex-col justify-end overflow-hidden rounded-[28px] bg-muted shadow-xl shadow-black/20 ring-1 ring-white/10 sm:min-h-128">
      <Link
        to="/hotels/$hotelId"
        params={hotelParams}
        aria-label={`View ${hotel.name}`}
        className="absolute inset-0"
      >
        <img
          src={imageUrl(hotelImage(hotel))}
          alt=""
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
      </Link>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-4">
        {photoCount > 1 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md">
            <Images className="size-3.5" />
            {photoCount} photos
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setSaved((v) => !v)}
          aria-pressed={saved}
          aria-label={saved ? `Unsave ${hotel.name}` : `Save ${hotel.name}`}
          className="pointer-events-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Heart
            className={cn(
              "size-4.5 transition-colors",
              saved && "fill-red-500 text-red-500",
            )}
          />
        </button>
      </div>

      <div className="relative z-10">
        {/* Frosted panel: the blur fades in from the top so there's no hard seam. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-black/35 backdrop-blur-2xl mask-[linear-gradient(to_bottom,transparent,black_15%)]"
        />

        <div className="relative flex flex-col p-5 sm:p-6">
          {/* Titles and blurbs vary in length, so each block reserves a fixed
              number of lines to keep the text aligned across cards in a row. */}
          <h3 className="line-clamp-2 font-serif text-2xl leading-tight font-bold text-white sm:text-[1.75rem]">
            <Link
              to="/hotels/$hotelId"
              params={hotelParams}
              className="transition-colors hover:text-white/80"
            >
              {hotel.name}
            </Link>
          </h3>

          <p className="mt-1 line-clamp-3 min-h-[3lh] text-sm text-pretty text-white/70">
            {hotel.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-baseline gap-1 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
              {hotel.minPrice != null ? (
                <>
                  <span className="text-sm font-bold text-white">
                    {gbp(hotel.minPrice)}
                  </span>
                  <span className="text-[11px] font-medium text-white/60">
                    /night
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-medium text-white/80">
                  Price on request
                </span>
              )}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Link
              to="/hotels/$hotelId"
              params={hotelParams}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              View hotel
            </Link>
            {onMap && (
              <Link
                to="/map"
                aria-label={`Show ${hotel.name} on the island map`}
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900 transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <MapPin className="size-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
