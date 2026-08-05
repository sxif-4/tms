import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FerrisWheelIcon,
  PalmtreeIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { PageHeading } from "~/components/page-heading";
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
import { imageUrl } from "~/lib/image-url";
import { EventTypeBadge } from "../components/park-badges";
import { LOCATION_TYPE_LABELS, gbp } from "../constants";
import { parkEventsQueryOptions } from "../queries";
import { deleteParkEventServerFn } from "../server";
import type { EventType, ParkEvent } from "../types";

/** Stands in for a cover photo until one's uploaded, keyed to the event type. */
const EVENT_ICONS: Record<EventType, typeof FerrisWheelIcon> = {
  ride: FerrisWheelIcon,
  show: SparklesIcon,
  beach_event: PalmtreeIcon,
};

export function ParkEventsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: events } = useSuspenseQuery(parkEventsQueryOptions());

  const [deletingEvent, setDeletingEvent] = useState<ParkEvent | null>(null);

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => deleteParkEventServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["park-events"] });
      toast.success("Event deleted");
      setDeletingEvent(null);
    },
    // 409 when schedules exist — the API's message steers staff to deactivate.
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete event",
      ),
  });

  const open = (id: number) =>
    void navigate({
      to: "/dashboard/park/events/$eventId",
      params: { eventId: String(id) },
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading />
        <Button asChild size="sm">
          <Link to="/dashboard/park/events/new">
            <PlusIcon data-icon="inline-start" />
            New event
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
          <CardDescription>
            Open an event to edit it, manage its photos and set the times it
            runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <EmptyState
              icon={FerrisWheelIcon}
              title="No events yet"
              description="Create a ride, show or beach event, then add the times it runs."
              action={
                <Button asChild>
                  <Link to="/dashboard/park/events/new">
                    <PlusIcon data-icon="inline-start" />
                    New event
                  </Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Photo</TableHead>
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
                  <TableRow
                    key={event.id}
                    // The whole row opens the event; the action buttons below
                    // stop propagation so delete doesn't navigate first.
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => open(event.id)}
                  >
                    <TableCell>
                      <EventThumbnail event={event} />
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
                        aria-label={`Edit ${event.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          open(event.id);
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${event.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingEvent(event);
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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

function EventThumbnail({ event }: { event: ParkEvent }) {
  const Icon = EVENT_ICONS[event.eventType];

  if (!event.image) {
    return (
      <span
        className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-md"
        title="No photo yet"
      >
        <Icon className="size-4" />
      </span>
    );
  }

  return (
    <img
      src={imageUrl(event.image)}
      alt=""
      loading="lazy"
      className="bg-muted size-11 rounded-md object-cover"
    />
  );
}
