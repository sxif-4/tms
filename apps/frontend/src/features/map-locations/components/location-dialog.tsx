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
  prefill: { top: number; left: number } | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = location != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<LocationType>("landmark");
  const [positionTop, setPositionTop] = useState("");
  const [positionLeft, setPositionLeft] = useState("");
  const [error, setError] = useState<string | null>(null);

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
  }, [open, location, prefill]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type,
        positionTop: Number(positionTop),
        positionLeft: Number(positionLeft),
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
            Position as a percentage of the map image — click the map or drag
            a pin to set these automatically.
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
            {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
