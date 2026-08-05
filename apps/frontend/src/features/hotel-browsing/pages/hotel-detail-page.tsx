import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Images } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { ImageLightbox } from "../components/image-lightbox";
import { AmenityIcon } from "~/lib/amenity-icon";
import { RoomOptionCard } from "../components/room-option-card";
import { gbp, hotelImage } from "../constants";
import { publicHotelQueryOptions } from "../queries";
import { imageUrl } from "~/lib/image-url";

/**
 * House policies are the same for every property — the schema has no per-hotel
 * policy columns yet. Kept in one place so the reassurance line on the booking
 * panel and the Policies section can never drift apart.
 */
const POLICY = {
  checkInFrom: "3:00 PM",
  checkOutBy: "11:00 AM",
  freeCancellationHours: 48,
};

function Section({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {aside && <p className="text-sm text-muted-foreground">{aside}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HotelDetailPage({ hotelId }: { hotelId: number }) {
  const { data: hotel } = useSuspenseQuery(publicHotelQueryOptions(hotelId));
  const gallery = hotel.images.length > 0 ? hotel.images : [hotelImage(hotel)];
  const heroImage = gallery[0];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const sleeps = hotel.roomTypes.reduce(
    (max, room) => Math.max(max, room.maxOccupancy),
    0,
  );
  /* The hero has to carry enough to decide on, so it pulls the facts that are
     otherwise scattered below the fold: price, choice, and party size. */
  const heroStats = [
    hotel.minPrice != null ? `From ${gbp(hotel.minPrice)} a night` : null,
    hotel.roomTypes.length > 0
      ? `${hotel.roomTypes.length} room ${hotel.roomTypes.length === 1 ? "type" : "types"}`
      : null,
    sleeps > 0 ? `Sleeps up to ${sleeps}` : null,
  ].filter(Boolean);

  return (
    <div>
      <div className="relative h-[66vh] min-h-110 w-full overflow-hidden">
        <button
          type="button"
          className="size-full cursor-zoom-in"
          onClick={() => openLightbox(0)}
          aria-label={`View photos of ${hotel.name}`}
        >
          <img
            src={imageUrl(heroImage)}
            alt={hotel.name}
            className="size-full object-cover"
          />
        </button>

        {/* The scrim is confined to the bottom band rather than washed over the
            whole frame — the top 40% of the photo stays untouched, and only the
            strip under the title fades to page colour so the heading has
            something solid to sit on. Both overlay layers stay
            pointer-events-none or they swallow the zoom target underneath. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-background from-5% via-background/80 via-30% to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pb-8 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {hotel.name}
              </h1>
              {heroStats.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {heroStats.join(" · ")}
                </p>
              )}
            </div>
            {gallery.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="pointer-events-auto gap-1.5"
                onClick={() => openLightbox(0)}
              >
                <Images className="size-3.5" />
                View all {gallery.length} photos
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-12">
            <p className="text-lg leading-relaxed text-pretty sm:text-xl">
              {hotel.description ?? "No description available yet."}
            </p>

            {hotel.facilities.length > 0 && (
              <Section id="facilities" title="Facilities">
                <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {hotel.facilities.map((facility) => (
                    <li key={facility.id} className="flex items-center gap-2.5">
                      <AmenityIcon
                        name={facility.icon}
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="text-sm">{facility.name}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section
              id="rooms"
              title="Rooms"
              aside={
                hotel.roomTypes.length > 0
                  ? `${hotel.roomTypes.length} to choose from`
                  : undefined
              }
            >
              {hotel.roomTypes.length === 0 ? (
                <p className="rounded-xl border bg-surface p-5 text-sm text-muted-foreground">
                  Rooms for this hotel aren&apos;t listed yet. Browse other
                  hotels or check back soon.
                </p>
              ) : (
                <div className="space-y-4">
                  {hotel.roomTypes.map((roomType) => (
                    <RoomOptionCard
                      key={roomType.id}
                      room={{ ...roomType, roomTypeId: roomType.id }}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section id="policies" title="Policies">
              <div className="space-y-4">
                <div className="rounded-xl border bg-surface p-5">
                  <h3 className="font-semibold">Check-in &amp; check-out</h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Check-in from
                      </dt>
                      <dd className="font-medium">{POLICY.checkInFrom}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Check-out by
                      </dt>
                      <dd className="font-medium">{POLICY.checkOutBy}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-xl border bg-surface p-5">
                  <h3 className="font-semibold">Cancellation</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cancel free up to {POLICY.freeCancellationHours} hours
                    before check-in. After that a one-night charge may apply.
                  </p>
                </div>
              </div>
            </Section>
          </div>

          {/* The one loud element on the page: deep ink lifts the only decision
              point off an otherwise all-white column, and lets the lime action
              colour land on the surface it was designed for. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {/* `--footer` is the same ink in both themes, so in dark mode it
                sits almost on top of `--background` — the ring is what keeps
                the panel an object rather than a hole. */}
            <div className="overflow-hidden rounded-2xl bg-footer p-6 text-white shadow-xl ring-1 ring-white/10">
              <p className="text-sm text-white/60">Starting from</p>
              {hotel.minPrice != null ? (
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">
                    {gbp(hotel.minPrice)}
                  </span>
                  <span className="text-sm text-white/60">per night</span>
                </p>
              ) : (
                <p className="mt-1 text-2xl font-semibold">Price on request</p>
              )}
              <Button asChild size="lg" className="mt-5 w-full">
                <Link
                  to="/hotels/$hotelId/book"
                  params={{ hotelId: String(hotel.id) }}
                >
                  Check availability &amp; book
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-white/50">
                Free cancellation up to {POLICY.freeCancellationHours} hours
                before check-in
              </p>
            </div>
          </aside>
        </div>
      </div>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={gallery}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        alt={hotel.name}
      />
    </div>
  );
}
