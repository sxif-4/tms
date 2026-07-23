import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CalendarPlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FerrisWheelIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { EmptyState } from "~/features/hotels/components/empty-state";
import { CapacityBar } from "../components/capacity-bar";
import { EventDialog } from "../components/event-dialog";
import { EventTypeBadge } from "../components/park-badges";
import { ScheduleDialog } from "../components/schedule-dialog";
import { LOCATION_TYPE_LABELS, gbp } from "../constants";
import { eventSchedulesQueryOptions, parkEventsQueryOptions } from "../queries";
import {
  deleteEventScheduleServerFn,
  deleteParkEventServerFn,
} from "../server";
import type { EventSchedule, ParkEvent } from "../types";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ParkEventsPage() {
  const queryClient = useQueryClient();
  const { data: events } = useSuspenseQuery(parkEventsQueryOptions());

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ParkEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<ParkEvent | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => deleteParkEventServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["park-events"] });
      toast.success("Event deleted");
      setDeletingEvent(null);
    },
    // 409 when schedules exist — the API's message steers staff to deactivate.
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete event"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">
            Rides, shows and beach events, and when each one runs.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingEvent(null);
            setEventDialogOpen(true);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          New event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
          <CardDescription>
            Expand an event to manage the times it runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState
              icon={FerrisWheelIcon}
              title="No events yet"
              description="Create a ride, show or beach event, then add the times it runs."
              action={
                <Button
                  onClick={() => {
                    setEditingEvent(null);
                    setEventDialogOpen(true);
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  New event
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Base price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  // Fragment carries the key: each event renders a row plus an
                  // optional expanded schedules row.
                  <Fragment key={event.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            expanded === event.id
                              ? "Hide schedules"
                              : "Show schedules"
                          }
                          aria-expanded={expanded === event.id}
                          onClick={() =>
                            setExpanded(expanded === event.id ? null : event.id)
                          }
                        >
                          {expanded === event.id ? (
                            <ChevronDownIcon />
                          ) : (
                            <ChevronRightIcon />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>
                        <EventTypeBadge type={event.eventType} />
                      </TableCell>
                      <TableCell>
                        {LOCATION_TYPE_LABELS[event.locationType]}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {gbp(Number(event.basePrice))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.isActive ? "default" : "destructive"}
                        >
                          {event.isActive ? "Active" : "Retired"}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Edit event"
                          onClick={() => {
                            setEditingEvent(event);
                            setEventDialogOpen(true);
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Delete event"
                          onClick={() => setDeletingEvent(event)}
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expanded === event.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <SchedulesPanel
                            eventId={event.id}
                            eventName={event.name}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
      />
      <ConfirmDialog
        open={deletingEvent != null}
        onOpenChange={(o) => !o && setDeletingEvent(null)}
        title="Delete event?"
        description={`"${deletingEvent?.name}" will be permanently removed. Events with schedules can't be deleted — retire them instead.`}
        confirmLabel="Delete"
        destructive
        pending={deleteEventMutation.isPending}
        onConfirm={() =>
          deletingEvent && deleteEventMutation.mutate(deletingEvent.id)
        }
      />
    </div>
  );
}

/** Child rows for one event — fetched only once its row is expanded. */
function SchedulesPanel({
  eventId,
  eventName,
}: {
  eventId: number;
  eventName: string;
}) {
  const queryClient = useQueryClient();
  const { data: schedules, isPending } = useQuery(
    eventSchedulesQueryOptions({ eventId }),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventSchedule | null>(null);
  const [deleting, setDeleting] = useState<EventSchedule | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEventScheduleServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedules"] });
      toast.success("Schedule deleted");
      setDeleting(null);
    },
    // 409 when bookings exist.
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete schedule",
      ),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Schedules</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <CalendarPlusIcon data-icon="inline-start" />
          Add schedule
        </Button>
      </div>

      {isPending ? (
        <p className="text-muted-foreground text-sm">Loading schedules…</p>
      ) : !schedules || schedules.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No schedules yet — add one so visitors can book seats.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Starts</TableHead>
              <TableHead className="w-48">Seats</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{fmtDateTime(s.startAt)}</TableCell>
                <TableCell>
                  <CapacityBar booked={s.booked} capacity={s.capacity} />
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Edit schedule"
                    onClick={() => {
                      setEditing(s);
                      setDialogOpen(true);
                    }}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Delete schedule"
                    onClick={() => setDeleting(s)}
                  >
                    <Trash2Icon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={eventId}
        eventName={eventName}
        schedule={editing}
      />
      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete schedule?"
        description="This schedule will be permanently removed. Schedules with bookings can't be deleted."
        confirmLabel="Delete"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
