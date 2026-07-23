import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  createEventScheduleServerFn,
  updateEventScheduleServerFn,
} from "../server";
import type { EventSchedule } from "../types";

const scheduleSchema = z.object({
  startAt: z.string().min(1, "Start time is required"),
  capacity: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .min(1, "At least 1 seat"),
});
type ScheduleValues = z.infer<typeof scheduleSchema>;

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in *local* time, not a UTC ISO string. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  schedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventName: string;
  schedule: EventSchedule | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = schedule != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { startAt: "", capacity: 50 },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      startAt: schedule ? toLocalInput(schedule.startAt) : "",
      capacity: schedule?.capacity ?? 50,
    });
  }, [open, schedule, reset]);

  const mutation = useMutation({
    mutationFn: (values: ScheduleValues) => {
      // The input is local time; send a real instant so the API's
      // "must be in the future" check compares like for like.
      const startAt = new Date(values.startAt).toISOString();
      return isEdit
        ? updateEventScheduleServerFn({
            data: { id: schedule.id, startAt, capacity: values.capacity },
          })
        : createEventScheduleServerFn({
            data: { eventId, startAt, capacity: values.capacity },
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["park-events"] });
      toast.success(isEdit ? "Schedule updated" : "Schedule created");
      onOpenChange(false);
    },
    // Surfaces the API's reasons verbatim: a past start time, or a capacity
    // below the seats already booked.
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit schedule" : "New schedule"}</DialogTitle>
          <DialogDescription>
            When {eventName} runs, and how many seats it has.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sc-start">Starts at</FieldLabel>
              <Input
                id="sc-start"
                type="datetime-local"
                {...register("startAt")}
              />
              <FieldError>{errors.startAt?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="sc-capacity">Seats</FieldLabel>
              <Input
                id="sc-capacity"
                type="number"
                min={1}
                {...register("capacity", { valueAsNumber: true })}
              />
              <FieldError>{errors.capacity?.message}</FieldError>
              {isEdit && schedule.booked > 0 && (
                <p className="text-muted-foreground text-xs">
                  {schedule.booked} seat(s) already booked — capacity can't go
                  below that.
                </p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
