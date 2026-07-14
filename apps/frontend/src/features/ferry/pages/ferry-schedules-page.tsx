import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDaysIcon,
  Clock3Icon,
  CompassIcon,
  UsersIcon,
} from "lucide-react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ferryRoutesQueryOptions, ferrySchedulesQueryOptions } from "~/features/ferry/queries";
import { createFerryScheduleServerFn } from "~/features/ferry/server";
import type { FerrySchedule } from "~/features/ferry/types";

function formatScheduleTime(value: string | Date) {
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDirectionLabel(direction: FerrySchedule["direction"]) {
  return direction === "to_theme_park" ? "To theme park" : "To island";
}

function getStatusLabel(status: FerrySchedule["status"]) {
  switch (status) {
    case "departed":
      return "Departed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Scheduled";
  }
}

export function FerrySchedulesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [routeId, setRouteId] = useState("");
  const [departureAt, setDepartureAt] = useState("");
  const [direction, setDirection] = useState<FerrySchedule["direction"]>("to_theme_park");
  const [capacity, setCapacity] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [status, setStatus] = useState<FerrySchedule["status"]>("scheduled");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: schedules = [], isLoading, isError, error } = useQuery(
    ferrySchedulesQueryOptions,
  );
  const { data: routes = [] } = useQuery(ferryRoutesQueryOptions);

  const routeNames = useMemo(
    () => Object.fromEntries(routes.map((route) => [route.id, route.name])),
    [routes],
  );

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return schedules;

    return schedules.filter((schedule) => {
      const routeName = routeNames[schedule.routeId] ?? `Route ${schedule.routeId}`;
      const timeLabel = formatScheduleTime(schedule.departureAt).toLowerCase();
      return (
        routeName.toLowerCase().includes(query) ||
        timeLabel.includes(query) ||
        getDirectionLabel(schedule.direction).toLowerCase().includes(query) ||
        getStatusLabel(schedule.status).toLowerCase().includes(query)
      );
    });
  }, [routeNames, schedules, search]);

  const mutation = useMutation({
    mutationFn: () =>
      createFerryScheduleServerFn({
        data: {
          routeId: Number(routeId),
          departureAt,
          direction,
          capacity: Number(capacity),
          basePrice: Number(basePrice),
          status,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ferrySchedulesQueryOptions.queryKey });
      toast.success("Ferry schedule created");
      setOpen(false);
      setRouteId("");
      setDepartureAt("");
      setDirection("to_theme_park");
      setCapacity("");
      setBasePrice("");
      setStatus("scheduled");
      setFormError(null);
    },
    onError: (err) =>
      setFormError(err instanceof Error ? err.message : "Failed to create ferry schedule"),
  });

  const canSubmit =
    routeId !== "" &&
    departureAt !== "" &&
    capacity !== "" &&
    basePrice !== "" &&
    Number(capacity) > 0 &&
    Number(basePrice) >= 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/30 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CalendarDaysIcon className="size-3.5" />
            Schedule board
          </Badge>
          <Badge variant="outline">{schedules.length} sailings</Badge>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold">Ferry schedules</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Plan departures, track route capacity, and keep each sailing aligned with expected demand.
            </p>
          </div>
          <Button className="w-fit" onClick={() => setOpen(true)}>
            Create sailing
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.85fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Upcoming departures</CardTitle>
            <CardDescription>Current sailings from the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Loading ferry schedules…
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Failed to load ferry schedules."}
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No sailings match your search yet.
              </div>
            ) : (
              filteredSchedules.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{routeNames[item.routeId] ?? `Route ${item.routeId}`}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatScheduleTime(item.departureAt)}</p>
                    </div>
                    <Badge variant="outline">{getStatusLabel(item.status)}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="size-4" />
                      {item.capacity} seats
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock3Icon className="size-4" />
                      {getDirectionLabel(item.direction)}
                    </span>
                    <span>•</span>
                    <span>{Number(item.basePrice).toFixed(2)} / ticket</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Adjust schedule</CardTitle>
            <CardDescription>Search existing sailings or add a new departure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by route or time"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              Use this board to review departure times, route capacity, and ticket pricing before boarding begins.
            </div>
            <div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
              Route capacity and pricing update immediately after each new sailing is created.
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create ferry schedule</DialogTitle>
            <DialogDescription>Add a new departure for the island ferry network.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="schedule-route">Route</Label>
              <Select value={routeId} onValueChange={setRouteId}>
                <SelectTrigger id="schedule-route">
                  <SelectValue placeholder="Select a route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={String(route.id)}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="schedule-time">Departure time</Label>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={departureAt}
                onChange={(event) => setDepartureAt(event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="schedule-direction">Direction</Label>
                <Select value={direction} onValueChange={(value) => setDirection(value as FerrySchedule["direction"])}>
                  <SelectTrigger id="schedule-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_theme_park">To theme park</SelectItem>
                    <SelectItem value="to_island">To island</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="schedule-status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as FerrySchedule["status"])}>
                  <SelectTrigger id="schedule-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="departed">Departed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="schedule-capacity">Capacity</Label>
                <Input
                  id="schedule-capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-price">Base price</Label>
                <Input
                  id="schedule-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(event) => setBasePrice(event.target.value)}
                />
              </div>
            </div>

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending ? "Creating…" : "Create schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
