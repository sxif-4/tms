import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Images } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { ImageLightbox } from "../components/image-lightbox";
import { RoomOptionCard } from "../components/room-option-card";
import { gbp, hotelImage } from "../constants";
import { publicHotelQueryOptions } from "../queries";

export function HotelDetailPage({ hotelId }: { hotelId: number }) {
  const { data: hotel } = useSuspenseQuery(publicHotelQueryOptions(hotelId));
  const gallery =
    hotel.images.length > 0 ? hotel.images : [hotelImage(hotel)];
  const heroImage = gallery[0];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div>
      <div className="relative h-[40vh] min-h-70 w-full overflow-hidden">
        <button
          type="button"
          className="size-full cursor-zoom-in"
          onClick={() => openLightbox(0)}
          aria-label={`View photos of ${hotel.name}`}
        >
          <img
            src={heroImage}
            alt={hotel.name}
            className="size-full object-cover"
          />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        {gallery.length > 1 && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute right-4 bottom-20 z-10 gap-1.5 sm:bottom-24"
            onClick={() => openLightbox(0)}
          >
            <Images className="size-3.5" />
            {gallery.length} photos
          </Button>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="mb-3">
              <Link to="/hotels">
                <ArrowLeft className="size-4" />
                Back to hotels
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {hotel.name}
            </h1>
          </div>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {gallery.map((src, i) => (
              <li key={`${src}-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => openLightbox(i)}
                  className="block size-16 overflow-hidden rounded-md border bg-muted ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:size-20"
                  aria-label={`Open photo ${i + 1}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {hotel.description ?? "No description available yet."}
                </p>
              </TabsContent>

              <TabsContent value="rooms" className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {hotel.roomTypes.length === 0
                    ? "No room types have been configured for this hotel yet."
                    : `${hotel.roomTypes.length} room ${hotel.roomTypes.length === 1 ? "type" : "types"} available.`}
                </p>
                {hotel.roomTypes.map((roomType) => (
                  <RoomOptionCard
                    key={roomType.id}
                    room={{ ...roomType, roomTypeId: roomType.id }}
                  />
                ))}
              </TabsContent>

              <TabsContent value="policies" className="mt-6 space-y-4">
                <div className="glass-data rounded-xl border p-5">
                  <h3 className="font-semibold">Check-in & check-out</h3>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Check-in from
                      </dt>
                      <dd className="font-medium">3:00 PM</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        Check-out by
                      </dt>
                      <dd className="font-medium">11:00 AM</dd>
                    </div>
                  </dl>
                </div>
                <div className="glass-data rounded-xl border p-5">
                  <h3 className="font-semibold">Cancellation policy</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Free cancellation up to 48 hours before check-in. Cancellations
                    made after that window may be subject to a one-night charge.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="glass-data-strong rounded-xl border p-5">
              <p className="text-sm text-muted-foreground">Starting from</p>
              <p className="text-3xl font-bold">
                {hotel.minPrice != null ? (
                  <>
                    {gbp(hotel.minPrice)}
                    <span className="text-base font-normal text-muted-foreground">
                      /night
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-medium text-muted-foreground">
                    Price on request
                  </span>
                )}
              </p>
              <Button asChild className="mt-4 w-full">
                <Link
                  to="/hotels/$hotelId/book"
                  params={{ hotelId: String(hotel.id) }}
                >
                  Check availability & book
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
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
