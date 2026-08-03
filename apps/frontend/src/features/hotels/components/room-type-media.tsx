import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, StarIcon, Trash2Icon } from "lucide-react";
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
import { PhotoDropzone } from "./photo-dropzone";

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
    // Sequential rather than parallel so ordering stays predictable and the
    // first photo reliably becomes the cover.
    mutationFn: async (files: File[]) => {
      for (const file of files) await uploadRoomTypeImage(roomTypeId, file);
      return files.length;
    },
    onSuccess: (count) => {
      refresh();
      toast.success(
        count === 1 ? "Photo uploaded" : `${count} photos uploaded`,
      );
    },
    onError: (err) => {
      refresh(); // some may have landed before the failure
      toast.error(err instanceof Error ? err.message : "Upload failed");
    },
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

  const busy = upload.isPending || setCover.isPending || remove.isPending;
  const list = images.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <PhotoDropzone
        onFiles={(files) => upload.mutate(files)}
        busy={busy}
        uploading={upload.isPending}
      />

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
