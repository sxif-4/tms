import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BanIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  PencilIcon,
  Trash2Icon,
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
import { Input } from "~/components/ui/input";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { PageHeading } from "~/components/page-heading";
import {
  DirectionBadge,
  ScheduleStatusBadge,
} from "~/features/ferry/components/ferry-badges";
import { FerryScheduleDialog } from "~/features/ferry/components/ferry-schedule-dialog";
import {
  FERRY_DIRECTION_LABELS,
  FERRY_SCHEDULE_STATUS_LABELS,
  gbp,
} from "~/features/ferry/constants";
import {
  ferryBookingsQueryOptions,
  ferryRoutesQueryOptions,
  ferrySchedulesQueryOptions,
} from "~/features/ferry/queries";
import {
  deleteFerryScheduleServerFn,
  updateFerryScheduleServerFn,
} from "~/features/ferry/server";
import type { FerrySchedule } from "~/features/ferry/types";

const fmtDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function FerrySchedulesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FerrySchedule | null>(null);
  const [deleting, setDeleting] = useState<FerrySchedule | null>(null);
  const [cancelling, setCancelling] = useState<FerrySchedule | null>(null);

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
  } = useQuery(ferrySchedulesQueryOptions);
  const { data: routes = [] } = useQuery(ferryRoutesQueryOptions);
  const { data: bookings = [] } = useQuery(ferryBookingsQueryOptions());

  const routeNames = useMemo(
    () => Object.fromEntries(routes.map((route) => [route.id, route.name])),
    [routes],
  );

  /** Seats taken. Cancelled bookings freed their seat, so they don't count. */
  const passengersByScheduleId = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      totals[booking.scheduleId] =
        (totals[booking.scheduleId] ?? 0) + booking.passengerCount;
    }
    return totals;
  }, [bookings]);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return schedules;

    return schedules.filter((schedule) => {
      const routeName =
        routeNames[schedule.routeId] ?? `Route ${schedule.routeId}`;
      return [
        routeName,
        fmtDateTime(schedule.departureAt),
        FERRY_DIRECTION_LABELS[schedule.direction],
        FERRY_SCHEDULE_STATUS_LABELS[schedule.status],
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [routeNames, schedules, search]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ferry", "schedules"] });

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      updateFerryScheduleServerFn({ data: { id, status: "cancelled" } }),
    onSuccess: () => {
      invalidate();
      toast.success("Sailing cancelled");
      setCancelling(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel sailing",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFerryScheduleServerFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Sailing deleted");
      setDeleting(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete sailing",
      ),
  });

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeading />

      <header className="border-border/60 bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <CalendarDaysIcon className="size-3.5" />
            Schedule board
          </Badge>
          <Badge variant="outline">{schedules.length} sailings</Badge>
        </div>
        <Button className="w-fit" onClick={openCreate}>
          Create sailing
        </Button>
      </header>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Departures</CardTitle>
              <CardDescription>
                Cancel a sailing to take it out of service — deleting is only
                possible while it has no bookings at all.
              </CardDescription>
            </div>
            <Input
              placeholder="Search route, time or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <EmptyState>Loading ferry schedules…</EmptyState>
          ) : isError ? (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
              {error instanceof Error
                ? error.message
                : "Failed to load ferry schedules."}
            </div>
          ) : filteredSchedules.length === 0 ? (
            <EmptyState>
              {search
                ? "No sailings match that search."
                : "No sailings scheduled yet."}
            </EmptyState>
          ) : (
            filteredSchedules.map((schedule) => {
              const booked = passengersByScheduleId[schedule.id] ?? 0;
              return (
                <div
                  key={schedule.id}
                  className="border-border/60 rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {routeNames[schedule.routeId] ??
                          `Route ${schedule.routeId}`}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {fmtDateTime(schedule.departureAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ScheduleStatusBadge status={schedule.status} />
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/dashboard/ferry/schedules/$scheduleId/manifest"
                          params={{ scheduleId: String(schedule.id) }}
                        >
                          <ClipboardListIcon data-icon="inline-start" />
                          Manifest
                        </Link>
                      </Button>
                      {schedule.status === "scheduled" ? (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Cancel sailing"
                          onClick={() => setCancelling(schedule)}
                        >
                          <BanIcon />
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit sailing"
                        onClick={() => {
                          setEditing(schedule);
                          setDialogOpen(true);
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete sailing"
                        onClick={() => setDeleting(schedule)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>

                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="size-4" />
                      {booked} / {schedule.capacity} passengers
                    </span>
                    <span>•</span>
                    <DirectionBadge direction={schedule.direction} />
                    <span>•</span>
                    <span className="tabular-nums">
                      {gbp(Number(schedule.basePrice))} / ticket
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <FerryScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={editing}
        routes={routes}
      />

      <ConfirmDialog
        open={cancelling != null}
        onOpenChange={(next) => {
          if (!next) setCancelling(null);
        }}
        title="Cancel this sailing?"
        description="The sailing stops accepting bookings. Existing bookings are left alone so you can rebook those passengers deliberately."
        confirmLabel="Cancel sailing"
        destructive
        pending={cancelMutation.isPending}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id)}
      />

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete sailing?"
        description="This sailing will be permanently removed. Sailings that have any bookings can't be deleted — cancel it instead."
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
