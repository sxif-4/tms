import { StarIcon, Trash2Icon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { StagedPhoto } from "../hooks/use-staged-photos";

/**
 * Previews for photos chosen before the room type exists. Mirrors the saved
 * gallery's controls so the create and edit screens behave identically —
 * these just aren't uploaded until the room type is saved.
 */
export function StagedPhotoGrid({
  photos,
  coverKey,
  onSetCover,
  onRemove,
  disabled = false,
}: {
  photos: StagedPhoto[];
  coverKey: string | null;
  onSetCover: (key: string) => void;
  onRemove: (key: string) => void;
  disabled?: boolean;
}) {
  if (photos.length === 0) return null;

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {photos.length} {photos.length === 1 ? "photo" : "photos"} ready — they
        upload when you save.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((photo) => {
          const isCover = photo.key === coverKey;
          return (
            <div
              key={photo.key}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted",
                isCover ? "border-brand" : "border-transparent",
              )}
            >
              <img
                src={photo.previewUrl}
                alt=""
                className="size-full object-cover"
              />
              {isCover && (
                <Badge className="absolute top-1 left-1 gap-1">
                  <StarIcon className="size-3" />
                  Cover
                </Badge>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {!isCover && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-7"
                    disabled={disabled}
                    aria-label={`Make ${photo.file.name} the cover photo`}
                    onClick={() => onSetCover(photo.key)}
                  >
                    <StarIcon className="size-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="size-7"
                  disabled={disabled}
                  aria-label={`Remove ${photo.file.name}`}
                  onClick={() => onRemove(photo.key)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
