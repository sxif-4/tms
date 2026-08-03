import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Combobox, type ComboboxOption } from "~/components/ui/combobox";
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
import { LOCATION_TYPE_LABELS } from "~/features/map-locations/constants";
import { mapLocationsQueryOptions } from "~/features/map-locations/queries";
import { FacilityPicker } from "./facility-picker";
import { hotelsQueryOptions } from "../queries";
import { createHotelServerFn, updateHotelServerFn } from "../server";
import type { Hotel } from "../types";

/** Sentinel for "no map pin" — the combobox can't hold an empty-string value. */
const NO_LOCATION = "none";

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
  const [mapLocationId, setMapLocationId] = useState<string>(NO_LOCATION);
  const [facilityIds, setFacilityIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const locations = useQuery(mapLocationsQueryOptions);

  const locationOptions: ComboboxOption[] = useMemo(
    () => [
      { value: NO_LOCATION, label: "Not pinned to the map" },
      ...(locations.data ?? []).map((location) => ({
        value: String(location.id),
        label: location.name,
        description: LOCATION_TYPE_LABELS[location.type] ?? location.type,
      })),
    ],
    [locations.data],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(hotel?.name ?? "");
    setDescription(hotel?.description ?? "");
    setMaxRooms(hotel ? String(hotel.maxRooms) : "");
    setMapLocationId(
      hotel?.mapLocationId != null ? String(hotel.mapLocationId) : NO_LOCATION,
    );
    setFacilityIds(hotel?.facilities?.map((f) => f.id) ?? []);
  }, [open, hotel]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        maxRooms: Number(maxRooms),
        mapLocationId:
          mapLocationId === NO_LOCATION ? undefined : Number(mapLocationId),
        facilityIds,
      };
      return isEdit
        ? updateHotelServerFn({ data: { id: hotel.id, ...payload } })
        : createHotelServerFn({ data: payload });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: hotelsQueryOptions.queryKey });
      toast.success(isEdit ? `Updated ${saved.name}` : `Created ${saved.name}`);
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

          <Section title="Location & capacity">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="hotel-location">Island map pin</Label>
                <Combobox
                  emptyText="No map pins found."
                  id="hotel-location"
                  loading={locations.isPending}
                  onChange={setMapLocationId}
                  options={locationOptions}
                  placeholder="Not pinned to the map"
                  searchPlaceholder="Search pins…"
                  value={mapLocationId}
                />
                <p className="text-xs text-muted-foreground">
                  Where the hotel shows on the visitor map.{" "}
                  <Link
                    className="underline underline-offset-2 hover:text-brand"
                    to="/dashboard/admin/map"
                  >
                    <MapPinIcon className="inline size-3" /> Manage pins
                  </Link>
                </p>
              </div>

              <div className="flex flex-col gap-2">
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
                  How many rooms this hotel holds in total. Individual rooms are
                  added under each room type.
                </p>
              </div>
            </div>
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
              ? "Saving…"
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
