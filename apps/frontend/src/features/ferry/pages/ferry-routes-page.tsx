import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CompassIcon, MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { PageHeading } from "~/components/page-heading";
import { FerryRouteDialog } from "~/features/ferry/components/ferry-route-dialog";
import {
  ferryRoutesQueryOptions,
  ferrySchedulesQueryOptions,
} from "~/features/ferry/queries";
import { deleteFerryRouteServerFn } from "~/features/ferry/server";
import type { FerryRoute } from "~/features/ferry/types";

export function FerryRoutesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FerryRoute | null>(null);
  const [deleting, setDeleting] = useState<FerryRoute | null>(null);

  const {
    data: routes = [],
    isLoading,
    isError,
    error,
  } = useQuery(ferryRoutesQueryOptions);
  const { data: schedules = [] } = useQuery(ferrySchedulesQueryOptions);

  /** Sailings per route — what makes a route undeletable. */
  const sailingsByRoute = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const schedule of schedules) {
      totals[schedule.routeId] = (totals[schedule.routeId] ?? 0) + 1;
    }
    return totals;
  }, [schedules]);

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return routes;

    return routes.filter((route) =>
      [route.name, route.origin, route.destination].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [routes, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFerryRouteServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferry", "routes"] });
      toast.success("Route deleted");
      setDeleting(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete route",
      ),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (route: FerryRoute) => {
    setEditing(route);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <header className="border-border/60 bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CompassIcon className="size-3.5" />
            Route management
          </Badge>
          <Badge variant="outline">{routes.length} services</Badge>
        </div>
        <Button className="w-fit" onClick={openCreate}>
          Add new route
        </Button>
      </header>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Route overview</CardTitle>
              <CardDescription>
                The services sailings are scheduled against.
              </CardDescription>
            </div>
            <Input
              placeholder="Search name, origin or destination"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <EmptyState>Loading ferry routes…</EmptyState>
          ) : isError ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load ferry routes."}
            </div>
          ) : filteredRoutes.length === 0 ? (
            <EmptyState>
              {search
                ? "No routes match that search."
                : "No ferry routes are available yet."}
            </EmptyState>
          ) : (
            filteredRoutes.map((route) => {
              const sailings = sailingsByRoute[route.id] ?? 0;
              return (
                <div
                  key={route.id}
                  className="border-border/60 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{route.name}</p>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                        <MapPinIcon className="size-4 shrink-0" />
                        {route.origin} → {route.destination}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {sailings} sailing{sailings === 1 ? "" : "s"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Edit ${route.name}`}
                        onClick={() => openEdit(route)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${route.name}`}
                        onClick={() => setDeleting(route)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <FerryRouteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        route={editing}
      />

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete route?"
        description={`"${deleting?.name}" will be permanently removed. Routes that still have sailings can't be deleted — remove those first.`}
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border/70 text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
      {children}
    </div>
  );
}
