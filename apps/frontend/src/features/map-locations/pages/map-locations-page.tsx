import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import { IslandMapCanvas } from "../components/island-map-canvas";
import { LocationDialog } from "../components/location-dialog";
import { LOCATION_TYPE_COLORS, LOCATION_TYPE_LABELS } from "../constants";
import { mapLocationsQueryOptions } from "../queries";
import {
  deleteMapLocationServerFn,
  updateMapLocationServerFn,
} from "../server";
import type { MapLocation } from "../types";

export function MapLocationsPage() {
  const queryClient = useQueryClient();
  const { data: locations } = useSuspenseQuery(mapLocationsQueryOptions);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MapLocation | null>(null);
  const [prefill, setPrefill] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<MapLocation | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: mapLocationsQueryOptions.queryKey,
    });

  const dragMutation = useMutation({
    mutationFn: (v: { id: number; top: number; left: number }) =>
      updateMapLocationServerFn({
        data: { id: v.id, positionTop: v.top, positionLeft: v.left },
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Location moved");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to move");
      invalidate(); // snap the pin back to the server position
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMapLocationServerFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Location deleted");
      setDeleting(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete"),
  });

  const openCreate = () => {
    setEditing(null);
    setPrefill({ top: 50, left: 50 });
    setDialogOpen(true);
  };
  const openCreateAt = (top: number, left: number) => {
    setEditing(null);
    setPrefill({ top, left });
    setDialogOpen(true);
  };
  const openEdit = (loc: MapLocation) => {
    setEditing(loc);
    setPrefill(null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            Map &amp; locations
          </h1>
          <p className="text-sm text-muted-foreground">
            Click the map to drop a pin, or drag a pin to reposition it.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New location
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IslandMapCanvas
            locations={locations}
            editable
            onCanvasClick={openCreateAt}
            onPinClick={openEdit}
            onPinDragEnd={(id, top, left) =>
              dragMutation.mutate({ id, top, left })
            }
          />
        </div>

        <div className="flex max-h-150 flex-col gap-2 overflow-y-auto">
          {locations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations yet.</p>
          ) : (
            locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: LOCATION_TYPE_COLORS[loc.type] }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {loc.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {LOCATION_TYPE_LABELS[loc.type]} ·{" "}
                    {Number(loc.positionTop).toFixed(1)}%,{" "}
                    {Number(loc.positionLeft).toFixed(1)}%
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(loc)}
                  aria-label="Edit location"
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(loc)}
                  aria-label="Delete location"
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editing}
        prefill={prefill}
      />
      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete location?"
        description={`"${deleting?.name}" will be permanently removed from the map.`}
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
