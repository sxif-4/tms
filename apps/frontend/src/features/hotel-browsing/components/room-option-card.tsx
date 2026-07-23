import { BedDouble, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { AmenityIcon } from "~/lib/amenity-icon";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";
import { ImageLightbox } from "./image-lightbox";

/**
 * Common subset of `RoomType` and `RoomTypeAvailability` — `availableRooms` is
 * only known once a date range has been picked, so it's optional here and the
 * "available / sold out" line only renders when it's present.
 */
export interface RoomOptionSummary {
  roomTypeId: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms?: number;
  image?: string | null;
  images?: string[];
  amenities?: { id: number; name: string; icon?: string | null }[];
}

const AMENITY_PREVIEW = 4;

function resolveGallery(room: RoomOptionSummary): string[] {
  if (room.images && room.images.length > 0) return room.images;
  if (room.image) return [room.image];
  return [];
}

export function RoomOptionCard({
  room,
  selected = false,
  onSelect,
}: {
  room: RoomOptionSummary;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const soldOut = room.availableRooms != null && room.availableRooms <= 0;
  const interactive = Boolean(onSelect);
  const amenities = room.amenities ?? [];
  const visibleAmenities = amenities.slice(0, AMENITY_PREVIEW);
  const extraAmenities = amenities.length - visibleAmenities.length;
  const gallery = resolveGallery(room);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const safePreview =
    gallery.length > 0
      ? ((previewIndex % gallery.length) + gallery.length) % gallery.length
      : 0;
  const mainSrc = gallery[safePreview];

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition-all",
        selected && "border-primary ring-2 ring-primary/30",
        interactive && !selected && "hover:border-primary/40",
        soldOut && "opacity-80",
      )}
    >
      <CardContent className="flex flex-col gap-0 p-0 sm:flex-row">
        {mainSrc ? (
          <div
            className={cn(
              "flex w-full shrink-0 flex-col gap-1.5 bg-muted p-2 sm:w-48",
              soldOut && "grayscale",
            )}
          >
            <button
              type="button"
              className="relative aspect-4/3 w-full overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => setLightboxOpen(true)}
              aria-label={`View photos of ${room.name}`}
            >
              <img
                src={mainSrc}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
            {gallery.length > 1 && (
              <ul className="flex gap-1.5 overflow-x-auto pb-0.5">
                {gallery.map((src, i) => (
                  <li key={`${src}-${i}`} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      className={cn(
                        "size-11 overflow-hidden rounded border-2 transition",
                        i === safePreview
                          ? "border-primary"
                          : "border-transparent opacity-80 hover:opacity-100",
                      )}
                      aria-label={`Show photo ${i + 1}`}
                      aria-current={i === safePreview}
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
            )}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <p className="font-semibold">{room.name}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {room.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                Up to {room.maxOccupancy} guests
              </span>
              {room.availableRooms != null && (
                <span className="flex items-center gap-1">
                  <BedDouble className="size-3.5" />
                  {soldOut
                    ? "Fully booked"
                    : `${room.availableRooms} of ${room.totalRooms} rooms available`}
                </span>
              )}
            </div>
            {visibleAmenities.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {visibleAmenities.map((a) => (
                  <li
                    key={a.id}
                    className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <AmenityIcon name={a.icon} />
                    {a.name}
                  </li>
                ))}
                {extraAmenities > 0 && (
                  <li className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    +{extraAmenities}
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <p className="text-lg font-semibold">
              {gbp(Number(room.basePricePerNight))}
              <span className="text-sm font-normal text-muted-foreground">
                /night
              </span>
            </p>
            {interactive && (
              <Button
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                disabled={soldOut}
                onClick={onSelect}
              >
                {selected ? "Selected" : soldOut ? "Sold out" : "Select"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {gallery.length > 0 && (
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          images={gallery}
          index={safePreview}
          onIndexChange={setPreviewIndex}
          alt={room.name}
        />
      )}
    </Card>
  );
}
