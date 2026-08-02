import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageIcon,
  Loader2Icon,
  StarIcon,
  Trash2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import {
  deleteRoomTypeImage,
  listRoomTypeImages,
  setRoomTypeCoverImage,
  uploadRoomTypeImage,
} from "../images-api";
import { roomTypeQueryOptions, roomTypesQueryOptions } from "../queries";

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Gallery management for a saved room type: drag-and-drop upload, cover
 * selection and deletion. Only rendered in edit mode — a room type has to
 * exist before photos can be attached to it.
 */
export function RoomTypeMedia({
  roomTypeId,
  hotelId,
}: {
  roomTypeId: number;
  hotelId: number;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const images = useQuery({
    queryKey: ["room-type-images", roomTypeId] as const,
    queryFn: () => listRoomTypeImages(roomTypeId),
  });

  const refresh = (next?: unknown) => {
    if (next !== undefined) {
      queryClient.setQueryData(["room-type-images", roomTypeId], next);
    } else {
      void queryClient.invalidateQueries({
        queryKey: ["room-type-images", roomTypeId],
      });
    }
    // The list row thumbnail and detail gallery read from these.
    void queryClient.invalidateQueries({
      queryKey: roomTypesQueryOptions(hotelId).queryKey,
    });
    void queryClient.invalidateQueries({
      queryKey: roomTypeQueryOptions(roomTypeId).queryKey,
    });
  };

  const upload = useMutation({
    mutationFn: (file: File) => uploadRoomTypeImage(roomTypeId, file),
    onSuccess: () => {
      refresh();
      toast.success("Photo uploaded");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Upload failed"),
  });

  const setCover = useMutation({
    mutationFn: (imageId: number) => setRoomTypeCoverImage(roomTypeId, imageId),
    onSuccess: (next) => {
      refresh(next);
      toast.success("Cover updated");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to set cover"),
  });

  const remove = useMutation({
    mutationFn: (imageId: number) => deleteRoomTypeImage(roomTypeId, imageId),
    onSuccess: (next) => {
      refresh(next);
      toast.success("Photo deleted");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete"),
  });

  /** Validates client-side too, so an oversized file never leaves the browser. */
  const accept = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPTED.split(",").includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are accepted");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 5 MB or smaller");
      return;
    }
    upload.mutate(file);
  };

  const busy = upload.isPending || setCover.isPending || remove.isPending;
  const list = images.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center transition-colors",
          dragging && "border-primary bg-accent/50",
        )}
      >
        {upload.isPending ? (
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloudIcon className="size-5 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          Drag and drop a photo, or
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WEBP · up to 5 MB
        </p>
      </div>

      {images.isPending ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ImageIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No photos yet</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            The cover photo is used as the thumbnail everywhere else.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted",
                  image.isCover ? "border-primary" : "border-transparent",
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
                      onClick={() => setCover.mutate(image.id)}
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
                    onClick={() => remove.mutate(image.id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
