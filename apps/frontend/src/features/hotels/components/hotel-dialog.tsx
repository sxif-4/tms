import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { FacilityPicker } from "./facility-picker";
import { HotelMedia } from "./hotel-media";
import { PhotoDropzone } from "./photo-dropzone";
import { StagedPhotoGrid } from "./staged-photo-grid";
import { useStagedPhotos } from "../hooks/use-staged-photos";
import { setHotelCoverImage, uploadHotelImage } from "../images-api";
import { hotelsQueryOptions } from "../queries";
import { createHotelServerFn, updateHotelServerFn } from "../server";
import type { Hotel } from "../types";

export function HotelDialog({
  open,
  onOpenChange,
  hotel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: Hotel | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = hotel != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxRooms, setMaxRooms] = useState("");
  const [facilityIds, setFacilityIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const staged = useStagedPhotos();

  const { clear: clearStaged } = staged;
  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(hotel?.name ?? "");
    setDescription(hotel?.description ?? "");
    setMaxRooms(hotel ? String(hotel.maxRooms) : "");
    setFacilityIds(hotel?.facilities?.map((f) => f.id) ?? []);
    clearStaged();
  }, [open, hotel, clearStaged]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        maxRooms: Number(maxRooms),
        facilityIds,
      };
      if (isEdit) {
        // Photos are managed live in edit mode, so there's nothing staged.
        const updated = await updateHotelServerFn({
          data: { id: hotel.id, ...payload },
        });
        return { saved: updated, failedPhotos: 0 };
      }

      const saved = await createHotelServerFn({ data: payload });

      // The hotel exists now, so photos can finally be attached. Each is
      // uploaded on its own — one bad file shouldn't lose the others.
      let coverImageId: number | null = null;
      let failedPhotos = 0;
      for (const photo of staged.photos) {
        try {
          const uploaded = await uploadHotelImage(saved.id, photo.file);
          if (photo.key === staged.coverKey) coverImageId = uploaded.id;
        } catch {
          failedPhotos += 1;
        }
      }
      // The first upload is cover by default; only correct it if asked.
      if (coverImageId !== null && staged.photos[0]?.key !== staged.coverKey) {
        try {
          await setHotelCoverImage(saved.id, coverImageId);
        } catch {
          /* cover is cosmetic — never fail the save over it */
        }
      }

      return { saved, failedPhotos };
    },
    onSuccess: ({ saved, failedPhotos }) => {
      queryClient.invalidateQueries({ queryKey: hotelsQueryOptions.queryKey });
      staged.clear();

      if (failedPhotos > 0) {
        // The hotel itself saved — say so, and name what didn't.
        toast.error(
          `${saved.name} was created, but ${failedPhotos} ${failedPhotos === 1 ? "photo" : "photos"} failed to upload. Edit the hotel to retry.`,
        );
      } else {
        toast.success(
          isEdit ? `Updated ${saved.name}` : `Created ${saved.name}`,
        );
      }
      onOpenChange(false);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Failed to save hotel"),
  });

  const rooms = Number(maxRooms);
  const canSubmit =
    name.trim().length > 0 && Number.isInteger(rooms) && rooms > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The facility catalog makes this form long, so the body is the single
          scroll region — heading and actions stay put instead of scrolling
          away, and the picker no longer scrolls inside its own box. */}
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-6">
          <DialogTitle>{isEdit ? "Edit hotel" : "Add hotel"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this hotel's details."
              : "Create a hotel, then assign staff to it from the Users page."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          <Section title="Basic information">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hotel-name">Name</Label>
              <Input
                id="hotel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Velara Overwater Resort"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hotel-description">Description (optional)</Label>
              <Textarea
                id="hotel-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of the hotel…"
                rows={3}
              />
            </div>
          </Section>

          <Section title="Capacity">
            <div className="flex flex-col gap-2 sm:max-w-64">
              <Label htmlFor="hotel-max-rooms">Room capacity</Label>
              <Input
                id="hotel-max-rooms"
                type="number"
                min={1}
                value={maxRooms}
                onChange={(e) => setMaxRooms(e.target.value)}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground">
                The most rooms this hotel can stock across all its room types.
                Enforced — room creation stops here once it's reached.
              </p>
            </div>
            {/* The map pin lives on the Map & Locations page now — a pin
                names the hotel it represents, rather than the hotel naming a
                pin, so an admin only ever sets it in one place. */}
            <p className="text-xs text-muted-foreground">
              {isEdit ? (
                <>
                  <Link
                    className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-brand"
                    to="/dashboard/admin/map"
                  >
                    <MapPinIcon className="size-3" /> Manage this hotel's map
                    pin
                  </Link>{" "}
                  from the island map.
                </>
              ) : (
                <>
                  Pin it to the island map from{" "}
                  <Link
                    className="underline underline-offset-2 hover:text-brand"
                    to="/dashboard/admin/map"
                  >
                    Map &amp; locations
                  </Link>{" "}
                  once it's created.
                </>
              )}
            </p>
          </Section>

          <Section title="Photos">
            {/* Edit mode talks to the API directly; create mode has no hotel
                id yet, so photos are staged and uploaded after it saves. */}
            {isEdit ? (
              <HotelMedia hotelId={hotel.id} />
            ) : (
              <>
                <PhotoDropzone busy={mutation.isPending} onFiles={staged.add} />
                <StagedPhotoGrid
                  coverKey={staged.coverKey}
                  disabled={mutation.isPending}
                  onRemove={staged.remove}
                  onSetCover={staged.setCoverKey}
                  photos={staged.photos}
                />
              </>
            )}
          </Section>

          <Section title="Facilities">
            <FacilityPicker selected={facilityIds} onChange={setFacilityIds} />
          </Section>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="border-t p-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending
              ? staged.photos.length > 0 && !isEdit
                ? "Saving & uploading…"
                : "Saving…"
              : isEdit
                ? "Save changes"
                : "Create hotel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Form section heading — a step above the facility category labels. */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
