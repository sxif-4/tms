import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  deleteHotelImage,
  listHotelImages,
  setHotelCoverImage,
  uploadHotelImage,
} from "../images-api";
import { hotelsQueryOptions } from "../queries";
import { PhotoDropzone } from "./photo-dropzone";
import { SavedPhotoGrid } from "./saved-photo-grid";

export const hotelImagesQueryKey = (hotelId: number) =>
  ["hotel-images", hotelId] as const;

/**
 * Photo management for a saved hotel: upload, cover selection and deletion.
 * Only rendered when editing — a hotel has to exist before photos can be
 * attached, so the create flow stages them instead (see `HotelDialog`).
 */
export function HotelMedia({ hotelId }: { hotelId: number }) {
  const queryClient = useQueryClient();

  const images = useQuery({
    queryKey: hotelImagesQueryKey(hotelId),
    queryFn: () => listHotelImages(hotelId),
  });

  const refresh = (next?: unknown) => {
    if (next !== undefined) {
      queryClient.setQueryData(hotelImagesQueryKey(hotelId), next);
    } else {
      void queryClient.invalidateQueries({
        queryKey: hotelImagesQueryKey(hotelId),
      });
    }
    // The hotels list carries `image`/`images`, so its thumbnails go stale too.
    void queryClient.invalidateQueries({
      queryKey: hotelsQueryOptions.queryKey,
    });
  };

  const upload = useMutation({
    // Sequential rather than parallel so ordering stays predictable and the
    // first photo reliably becomes the cover.
    mutationFn: async (files: File[]) => {
      for (const file of files) await uploadHotelImage(hotelId, file);
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
    mutationFn: (imageId: number) => setHotelCoverImage(hotelId, imageId),
    onSuccess: (next) => {
      refresh(next);
      toast.success("Cover updated");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to set cover"),
  });

  const remove = useMutation({
    mutationFn: (imageId: number) => deleteHotelImage(hotelId, imageId),
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
            The cover photo represents this hotel everywhere else.
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
