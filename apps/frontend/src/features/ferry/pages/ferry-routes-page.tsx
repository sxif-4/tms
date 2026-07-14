import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, CompassIcon, MapPinIcon, ShipWheelIcon } from "lucide-react";
import { useState } from "react";
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
import { ferryRoutesQueryOptions } from "~/features/ferry/queries";
import { createFerryRouteServerFn } from "~/features/ferry/server";

export function FerryRoutesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: routes = [], isLoading, isError, error } = useQuery(
    ferryRoutesQueryOptions,
  );

  const mutation = useMutation({
    mutationFn: () =>
      createFerryRouteServerFn({
        data: { name: name.trim(), origin: origin.trim(), destination: destination.trim() },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ferryRoutesQueryOptions.queryKey });
      toast.success("Ferry route created");
      setOpen(false);
      setName("");
      setOrigin("");
      setDestination("");
      setFormError(null);
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : "Failed to create ferry route"),
  });

  const canSubmit = name.trim() !== "" && origin.trim() !== "" && destination.trim() !== "";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CompassIcon className="size-3.5" />
            Route management
          </Badge>
          <Badge variant="outline">{routes.length} active services</Badge>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ferry routes</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Monitor island routes, service frequency, and passenger capacity from one place.
            </p>
          </div>
          <Button className="w-fit" onClick={() => setOpen(true)}>Add new route</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Route overview</CardTitle>
            <CardDescription>Live service map for the island ferry network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Loading ferry routes…
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load ferry routes."}
              </div>
            ) : routes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No ferry routes are available yet.
              </div>
            ) : (
              routes.map((route) => (
                <div key={route.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{route.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPinIcon className="size-4" />
                        {route.origin} → {route.destination}
                      </div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Origin: {route.origin}</span>
                    <span>•</span>
                    <span>Destination: {route.destination}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShipWheelIcon className="size-4" />
                      Vessel ready
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <ArrowRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Quick search</CardTitle>
            <CardDescription>Find routes by destination or capacity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search route" />
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Suggested actions: add a new stop, update frequency, or pause a low-traffic route.
            </div>
            <div className="rounded-xl bg-cyan-500/10 p-4 text-sm text-cyan-800 dark:text-cyan-300">
              Peak traffic is expected between 08:00 and 13:00. Consider adding extra capacity to Picnic Bay Express.
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add ferry route</DialogTitle>
            <DialogDescription>Create a new route for the island ferry network.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="route-name">Route name</Label>
              <Input id="route-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="route-origin">Origin</Label>
                <Input id="route-origin" value={origin} onChange={(event) => setOrigin(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="route-destination">Destination</Label>
                <Input id="route-destination" value={destination} onChange={(event) => setDestination(event.target.value)} />
              </div>
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending ? "Creating…" : "Add route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
