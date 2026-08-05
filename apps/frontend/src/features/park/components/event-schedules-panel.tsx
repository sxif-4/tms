import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { CapacityBar } from "./capacity-bar";
import { ScheduleDialog } from "./schedule-dialog";
import { eventSchedulesQueryOptions } from "../queries";
import { deleteEventScheduleServerFn } from "../server";
import type { EventSchedule } from "../types";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * The times one event runs, and how full each is. Lives on the event's own
 * page — it used to be crammed into an expanded row on the events table, which
 * left no room for the capacity bars and allowed only one event open at once.
 */
export function EventSchedulesPanel({
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
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
              <TableHead className="w-64">Seats</TableHead>
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
