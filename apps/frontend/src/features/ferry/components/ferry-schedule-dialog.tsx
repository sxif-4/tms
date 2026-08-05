import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  FERRY_DIRECTION_LABELS,
  FERRY_SCHEDULE_STATUS_LABELS,
} from "../constants";
import {
  createFerryScheduleServerFn,
  updateFerryScheduleServerFn,
} from "../server";
import type { FerryRoute, FerrySchedule } from "../types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const scheduleSchema = z.object({
  routeId: z.string().min(1, "Route is required"),
  departureAt: z.string().min(1, "Departure time is required"),
  direction: z.enum(["to_theme_park", "to_island"]),
  capacity: z.number().int().min(1, "At least one seat"),
  basePrice: z
    .string()
    .trim()
    .regex(DECIMAL, "Enter a decimal amount like 40.00"),
  status: z.enum(["scheduled", "departed", "cancelled"]),
});
type ScheduleValues = z.infer<typeof scheduleSchema>;

/**
 * `datetime-local` speaks wall-clock time with no zone. Formatting from and
 * parsing back to a real instant keeps the browser's clock authoritative —
 * sending the raw string would let the server read it in *its* timezone.
 */
function toLocalInput(value: string | Date): string {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FerryScheduleDialog({
  open,
  onOpenChange,
  schedule,
  routes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: FerrySchedule | null;
  routes: FerryRoute[];
}) {
  const queryClient = useQueryClient();
  const isEdit = schedule != null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      routeId: "",
      departureAt: "",
      direction: "to_theme_park",
      capacity: 60,
      basePrice: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      routeId: schedule ? String(schedule.routeId) : "",
      departureAt: schedule ? toLocalInput(schedule.departureAt) : "",
      direction: schedule?.direction ?? "to_theme_park",
      capacity: schedule?.capacity ?? 60,
      basePrice: schedule?.basePrice ?? "",
      status: schedule?.status ?? "scheduled",
    });
  }, [open, schedule, reset]);

  const mutation = useMutation({
    mutationFn: (values: ScheduleValues) => {
      const payload = {
        routeId: Number(values.routeId),
        departureAt: new Date(values.departureAt).toISOString(),
        direction: values.direction,
        capacity: values.capacity,
        basePrice: Number(values.basePrice),
        status: values.status,
      };
      return isEdit
        ? updateFerryScheduleServerFn({ data: { id: schedule.id, ...payload } })
        : createFerryScheduleServerFn({ data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ferry", "schedules"] });
      toast.success(isEdit ? "Sailing updated" : "Sailing created");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit sailing" : "New sailing"}</DialogTitle>
          <DialogDescription>
            A departure on the island ferry network. Capacity and fare are fixed
            per sailing.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="schedule-route">Route</FieldLabel>
              <Controller
                control={control}
                name="routeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
              <FieldError>{errors.routeId?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="schedule-time">Departure time</FieldLabel>
              <Input
                id="schedule-time"
                type="datetime-local"
                {...register("departureAt")}
              />
              <FieldError>{errors.departureAt?.message}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-direction">Direction</FieldLabel>
                <Controller
                  control={control}
                  name="direction"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="schedule-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(
                            FERRY_DIRECTION_LABELS,
                          ) as FerrySchedule["direction"][]
                        ).map((direction) => (
                          <SelectItem key={direction} value={direction}>
                            {FERRY_DIRECTION_LABELS[direction]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.direction?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="schedule-status">Status</FieldLabel>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="schedule-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(
                            FERRY_SCHEDULE_STATUS_LABELS,
                          ) as FerrySchedule["status"][]
                        ).map((status) => (
                          <SelectItem key={status} value={status}>
                            {FERRY_SCHEDULE_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.status?.message}</FieldError>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="schedule-capacity">Capacity</FieldLabel>
                <Input
                  id="schedule-capacity"
                  type="number"
                  min="1"
                  {...register("capacity", { valueAsNumber: true })}
                />
                <FieldError>{errors.capacity?.message}</FieldError>
                {isEdit ? (
                  <p className="text-muted-foreground text-xs">
                    Cannot drop below the seats already booked.
                  </p>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="schedule-price">
                  Fare per ticket (£)
                </FieldLabel>
                <Input
                  id="schedule-price"
                  placeholder="40.00"
                  {...register("basePrice")}
                />
                <FieldError>{errors.basePrice?.message}</FieldError>
              </Field>
            </div>
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
