import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { hotelsQueryOptions } from "~/features/hotels/queries";
import { setHotelMapLocationServerFn } from "~/features/hotels/server";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "../constants";
import { mapLocationsQueryOptions } from "../queries";
import {
  createMapLocationServerFn,
  updateMapLocationServerFn,
} from "../server";
import type { LocationType, MapLocation } from "../types";

/** Sentinel for "no hotel linked" — the combobox can't hold an empty-string value. */
const NO_HOTEL = "none";

export function LocationDialog({
  open,
  onOpenChange,
  location,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: MapLocation | null;
  prefill: { top: number; left: number } | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = location != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<LocationType>("landmark");
  const [positionTop, setPositionTop] = useState("");
  const [positionLeft, setPositionLeft] = useState("");
  const [linkedHotelId, setLinkedHotelId] = useState<string>(NO_HOTEL);
  const [error, setError] = useState<string | null>(null);

  const hotels = useQuery(hotelsQueryOptions);

  // The value `linkedHotelId` started at for this open — so the save step can
  // tell "nothing changed" from "explicitly re-picked the same hotel" and skip
  // a no-op write (every hotel PATCH leaves an audit-log entry).
  const initialLinkedHotelId = useRef(NO_HOTEL);
  const didInitLinkedHotel = useRef(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(location?.name ?? "");
    setDescription(location?.description ?? "");
    setType(location?.type ?? "landmark");
    setPositionTop(
      location ? location.positionTop : (prefill?.top.toFixed(2) ?? ""),
    );
    setPositionLeft(
      location ? location.positionLeft : (prefill?.left.toFixed(2) ?? ""),
    );
    setLinkedHotelId(NO_HOTEL);
    initialLinkedHotelId.current = NO_HOTEL;
    didInitLinkedHotel.current = false;
  }, [open, location, prefill]);

  // Runs once the hotel list resolves, so a slow first load doesn't clobber
  // whatever the admin's already picked in the combobox.
  useEffect(() => {
    if (!open || !location || didInitLinkedHotel.current || !hotels.data) {
      return;
    }
    didInitLinkedHotel.current = true;
    const match = hotels.data.find((h) => h.mapLocationId === location.id);
    const id = match ? String(match.id) : NO_HOTEL;
    setLinkedHotelId(id);
    initialLinkedHotelId.current = id;
  }, [open, location, hotels.data]);

  const hotelOptions: ComboboxOption[] = useMemo(
    () => [
      { value: NO_HOTEL, label: "No hotel linked" },
      ...(hotels.data ?? []).map((h) => ({
        value: String(h.id),
        label: h.name,
        description:
          h.mapLocationId != null && h.mapLocationId !== location?.id
            ? "Already linked to another pin"
            : undefined,
      })),
    ],
    [hotels.data, location],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type,
        positionTop: Number(positionTop),
        positionLeft: Number(positionLeft),
      };
      const saved = isEdit
        ? await updateMapLocationServerFn({
            data: { id: location.id, ...payload },
          })
        : await createMapLocationServerFn({ data: payload });

      if (type === "hotel") {
        if (linkedHotelId !== initialLinkedHotelId.current) {
          // Whichever hotel currently claims this pin gets unlinked first —
          // a pin should only ever represent one hotel at a time.
          const stale = hotels.data?.find(
            (h) =>
              h.mapLocationId === saved.id && String(h.id) !== linkedHotelId,
          );
          if (stale) {
            await setHotelMapLocationServerFn({
              data: { id: stale.id, mapLocationId: null },
            });
          }
          if (linkedHotelId !== NO_HOTEL) {
            await setHotelMapLocationServerFn({
              data: { id: Number(linkedHotelId), mapLocationId: saved.id },
            });
          }
        }
      } else {
        // Reclassified away from "hotel" — drop a link that no longer makes sense.
        const stale = hotels.data?.find((h) => h.mapLocationId === saved.id);
        if (stale) {
          await setHotelMapLocationServerFn({
            data: { id: stale.id, mapLocationId: null },
          });
        }
      }

      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: mapLocationsQueryOptions.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: hotelsQueryOptions.queryKey });
      toast.success(isEdit ? "Location updated" : "Location added");
      onOpenChange(false);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Something went wrong"),
  });

  const top = Number(positionTop);
  const left = Number(positionLeft);
  const canSubmit =
    name.trim() &&
    description.trim() &&
    positionTop !== "" &&
    positionLeft !== "" &&
    top >= 0 &&
    top <= 100 &&
    left >= 0 &&
    left <= 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit location" : "New location"}</DialogTitle>
          <DialogDescription>
            Points of interest shown on the island map.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="loc-name">Name</Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="loc-desc">Description</Label>
            <Input
              id="loc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="loc-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as LocationType)}
            >
              <SelectTrigger id="loc-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LOCATION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {type === "hotel" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="loc-hotel">Linked hotel</Label>
              <Combobox
                emptyText="No hotels found."
                id="loc-hotel"
                loading={hotels.isPending}
                onChange={setLinkedHotelId}
                options={hotelOptions}
                placeholder="No hotel linked"
                searchPlaceholder="Search hotels…"
                value={linkedHotelId}
              />
              <p className="text-xs text-muted-foreground">
                Which hotel this pin represents on the visitor map.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="loc-top">Top (%)</Label>
              <Input
                id="loc-top"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={positionTop}
                onChange={(e) => setPositionTop(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="loc-left">Left (%)</Label>
              <Input
                id="loc-left"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={positionLeft}
                onChange={(e) => setPositionLeft(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Position as a percentage of the map image — click the map or drag a
            pin to set these automatically.
          </p>
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
                : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
