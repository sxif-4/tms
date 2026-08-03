import { StarIcon, Trash2Icon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import type { RoomTypeImage } from "../types";

/**
 * Tile grid for photos that already exist on the server, shared by the hotel
 * and room-type galleries — both own the same `imageables` shape, so the cover
 * badge and the set-cover / delete controls behave identically.
 *
 * The staged equivalent (photos chosen before their owner exists) is
 * `StagedPhotoGrid`; it can't share this one because it renders object URLs
 * and is keyed by a local string rather than an image id.
 */
export function SavedPhotoGrid({
  images,
  busy = false,
  onSetCover,
  onRemove,
}: {
  images: RoomTypeImage[];
  busy?: boolean;
  onSetCover: (imageId: number) => void;
  onRemove: (imageId: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            "group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted",
            image.isCover ? "border-brand" : "border-transparent",
          )}
        >
          <img
            src={imageUrl(image.url)}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
          {image.isCover && (
            <Badge className="absolute top-1 left-1 gap-1">
              <StarIcon className="size-3" />
              Cover
            </Badge>
          )}
          <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {!image.isCover && (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="size-7"
                disabled={busy}
                aria-label="Make cover photo"
                onClick={() => onSetCover(image.id)}
              >
                <StarIcon className="size-3.5" />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="size-7"
              disabled={busy}
              aria-label="Delete photo"
              onClick={() => onRemove(image.id)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
