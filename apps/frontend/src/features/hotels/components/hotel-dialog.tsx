import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { mapLocationsQueryOptions } from "~/features/map-locations/queries";
import { FacilityPicker } from "./facility-picker";
import { hotelsQueryOptions } from "../queries";
import { createHotelServerFn, updateHotelServerFn } from "../server";
import type { Hotel } from "../types";

/** Sentinel for "no map pin" — Radix Select can't hold an empty-string value. */
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit hotel" : "Add hotel"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this hotel's details."
              : "Create a hotel, then assign staff to it from the Users page."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
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
              placeholder="Overwater villas on the north reef…"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-max-rooms">Maximum rooms</Label>
            <Input
              id="hotel-max-rooms"
              type="number"
              min={1}
              value={maxRooms}
              onChange={(e) => setMaxRooms(e.target.value)}
              placeholder="40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hotel-location">Map location (optional)</Label>
            <Select value={mapLocationId} onValueChange={setMapLocationId}>
              <SelectTrigger id="hotel-location" className="w-full">
                <SelectValue placeholder="Not pinned to the map" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NO_LOCATION}>
                    Not pinned to the map
                  </SelectItem>
                  {(locations.data ?? []).map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Facilities</Label>
            <div className="max-h-56 overflow-y-auto rounded-lg border p-3">
              <FacilityPicker
                selected={facilityIds}
                onChange={setFacilityIds}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
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
