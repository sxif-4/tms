import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "../constants";
import { mapLocationsQueryOptions } from "../queries";
import {
  createMapLocationServerFn,
  updateMapLocationServerFn,
} from "../server";
import type { LocationType, MapLocation } from "../types";

export function LocationDialog({
  open,
  onOpenChange,
  location,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: MapLocation | null;
  prefill: { lat: number; lng: number } | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = location != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<LocationType>("landmark");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(location?.name ?? "");
    setDescription(location?.description ?? "");
    setType(location?.type ?? "landmark");
    setLatitude(location ? location.latitude : (prefill?.lat.toFixed(7) ?? ""));
    setLongitude(
      location ? location.longitude : (prefill?.lng.toFixed(7) ?? ""),
    );
  }, [open, location, prefill]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type,
        latitude: Number(latitude),
        longitude: Number(longitude),
      };
      return isEdit
        ? updateMapLocationServerFn({ data: { id: location.id, ...payload } })
        : createMapLocationServerFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: mapLocationsQueryOptions.queryKey,
      });
      toast.success(isEdit ? "Location updated" : "Location added");
      onOpenChange(false);
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Something went wrong"),
  });

  const lat = Number(latitude);
  const lng = Number(longitude);
  const canSubmit =
    name.trim() &&
    description.trim() &&
    latitude !== "" &&
    longitude !== "" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

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
            <Select value={type} onValueChange={(v) => setType(v as LocationType)}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="loc-lat">Latitude</Label>
              <Input
                id="loc-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="loc-lng">Longitude</Label>
              <Input
                id="loc-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
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
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
