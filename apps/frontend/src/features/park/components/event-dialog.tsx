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
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
} from "../constants";
import { createParkEventServerFn, updateParkEventServerFn } from "../server";
import type { ParkEvent } from "../types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const eventSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().min(1, "Description is required"),
  eventType: z.enum(["ride", "show", "beach_event"]),
  locationType: z.enum(["theme_park", "beach"]),
  basePrice: z
    .string()
    .trim()
    .regex(DECIMAL, "Enter a decimal amount like 12.50"),
  isActive: z.boolean(),
});
type EventValues = z.infer<typeof eventSchema>;

export function EventDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ParkEvent | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = event != null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      eventType: "ride",
      locationType: "theme_park",
      basePrice: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: event?.name ?? "",
      description: event?.description ?? "",
      eventType: event?.eventType ?? "ride",
      locationType: event?.locationType ?? "theme_park",
      basePrice: event?.basePrice ?? "",
      isActive: event?.isActive ?? true,
    });
  }, [open, event, reset]);

  const mutation = useMutation({
    mutationFn: (values: EventValues) =>
      isEdit
        ? updateParkEventServerFn({ data: { id: event.id, ...values } })
        : createParkEventServerFn({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["park-events"] });
      toast.success(isEdit ? "Event updated" : "Event created");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            Rides, shows and beach events visitors can book seats on.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ev-name">Name</FieldLabel>
              <Input id="ev-name" {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="ev-description">Description</FieldLabel>
              <Textarea
                id="ev-description"
                rows={3}
                {...register("description")}
              />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ev-type">Type</FieldLabel>
                <Controller
                  control={control}
                  name="eventType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="ev-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {EVENT_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.eventType?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="ev-location">Location</FieldLabel>
                <Controller
                  control={control}
                  name="locationType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="ev-location">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {LOCATION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.locationType?.message}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ev-price">Base price (£)</FieldLabel>
              <Input id="ev-price" placeholder="12.50" {...register("basePrice")} />
              <FieldError>{errors.basePrice?.message}</FieldError>
            </Field>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="ev-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="ev-active">
                    Active — visitors can book this event
                  </FieldLabel>
                </Field>
              )}
            />
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
