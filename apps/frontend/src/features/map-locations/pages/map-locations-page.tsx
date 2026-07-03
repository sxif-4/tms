import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import { LocationDialog } from "../components/location-dialog";
import {
  DEFAULT_CENTER,
  LOCATION_TYPE_COLORS,
  LOCATION_TYPE_LABELS,
} from "../constants";
import { mapLocationsQueryOptions } from "../queries";
import {
  deleteMapLocationServerFn,
  updateMapLocationServerFn,
} from "../server";
import type { MapLocation } from "../types";

// Client-only: Leaflet touches `window`, so keep it out of the SSR render.
const LocationsMap = lazy(() => import("../components/locations-map"));

function MapFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  );
}

export function MapLocationsPage() {
  const queryClient = useQueryClient();
  const { data: locations } = useSuspenseQuery(mapLocationsQueryOptions);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MapLocation | null>(null);
  const [prefill, setPrefill] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<MapLocation | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return DEFAULT_CENTER;
    const lat =
      locations.reduce((s, l) => s + Number(l.latitude), 0) / locations.length;
    const lng =
      locations.reduce((s, l) => s + Number(l.longitude), 0) / locations.length;
    return [lat, lng];
  }, [locations]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: mapLocationsQueryOptions.queryKey,
    });

  const dragMutation = useMutation({
    mutationFn: (v: { id: number; lat: number; lng: number }) =>
      updateMapLocationServerFn({
        data: { id: v.id, latitude: v.lat, longitude: v.lng },
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
    setPrefill({ lat: center[0], lng: center[1] });
    setDialogOpen(true);
  };
  const openCreateAt = (lat: number, lng: number) => {
    setEditing(null);
    setPrefill({ lat, lng });
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
        {/* `relative z-0` puts the map in its own stacking context at z-index
            0, so Leaflet's high pane z-indexes (up to 800) can't paint over
            modals/dropdowns (which sit at z-50). */}
        <div className="relative z-0 h-150 overflow-hidden rounded-xl ring-1 ring-foreground/10 lg:col-span-2">
          {mounted ? (
            <Suspense fallback={<MapFallback />}>
              <LocationsMap
                locations={locations}
                center={center}
                onMapClick={openCreateAt}
                onMarkerDragEnd={(id, lat, lng) =>
                  dragMutation.mutate({ id, lat, lng })
                }
                onMarkerClick={openEdit}
              />
            </Suspense>
          ) : (
            <MapFallback />
          )}
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
                    {LOCATION_TYPE_LABELS[loc.type]} · {Number(loc.latitude).toFixed(4)},{" "}
                    {Number(loc.longitude).toFixed(4)}
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
