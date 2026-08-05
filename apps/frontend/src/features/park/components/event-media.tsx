import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PhotoDropzone } from "~/features/hotels/components/photo-dropzone";
import { SavedPhotoGrid } from "~/features/hotels/components/saved-photo-grid";
import {
  deleteEventImage,
  listEventImages,
  setEventCoverImage,
  uploadEventImage,
} from "~/features/hotels/images-api";

export const eventImagesQueryKey = (eventId: number) =>
  ["event-images", eventId] as const;

/**
 * Photos for a saved ride, show or beach event: upload, cover selection and
 * deletion. Only rendered once the event exists — there's nothing to attach a
 * photo to before that, so the create flow stages them instead.
 *
 * The dropzone and tile grid are the hotel ones: all three galleries are the
 * same `imageables` shape, and a park-specific copy would drift.
 */
export function EventMedia({ eventId }: { eventId: number }) {
  const queryClient = useQueryClient();

  const images = useQuery({
    queryKey: eventImagesQueryKey(eventId),
    queryFn: () => listEventImages(eventId),
  });

  const refresh = (next?: unknown) => {
    if (next !== undefined) {
      queryClient.setQueryData(eventImagesQueryKey(eventId), next);
    } else {
      void queryClient.invalidateQueries({
        queryKey: eventImagesQueryKey(eventId),
      });
    }
    // The events list and the visitor-facing cards both carry the cover, so
    // their thumbnails go stale the moment this changes.
    void queryClient.invalidateQueries({ queryKey: ["park-events"] });
    void queryClient.invalidateQueries({ queryKey: ["public-events"] });
  };

  const upload = useMutation({
    // Sequential rather than parallel so ordering stays predictable and the
    // first photo reliably becomes the cover.
    mutationFn: async (files: File[]) => {
      for (const file of files) await uploadEventImage(eventId, file);
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
    mutationFn: (imageId: number) => setEventCoverImage(eventId, imageId),
    onSuccess: (next) => {
      refresh(next);
      toast.success("Cover updated");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to set cover"),
  });

  const remove = useMutation({
    mutationFn: (imageId: number) => deleteEventImage(eventId, imageId),
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
        <p className="text-muted-foreground text-sm">Loading photos…</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ImageIcon className="text-muted-foreground size-5" />
          <p className="text-muted-foreground text-sm">No photos yet</p>
          <p className="text-muted-foreground text-xs">
            Visitors see an icon until this ride has a photo.
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">
            The cover photo represents this event everywhere else.
          </p>
          <SavedPhotoGrid
            busy={busy}
            images={list}
            onRemove={(imageId) => remove.mutate(imageId)}
            onSetCover={(imageId) => setCover.mutate(imageId)}
          />
        </>
      )}
    </div>
  );
}
