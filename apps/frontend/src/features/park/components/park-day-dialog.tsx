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
import { Switch } from "~/components/ui/switch";
import { clearParkDayServerFn, upsertParkDayServerFn } from "../server";
import type { ParkDay } from "../types";

const parkDaySchema = z.object({
  capacity: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .min(0, "Can't be negative"),
  isClosed: z.boolean(),
  note: z.string().trim().max(255).optional(),
});
type ParkDayValues = z.infer<typeof parkDaySchema>;

const fmtDay = (key: string) =>
  new Date(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function ParkDayDialog({
  open,
  onOpenChange,
  day,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: ParkDay | null;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParkDayValues>({
    resolver: zodResolver(parkDaySchema),
    defaultValues: { capacity: 0, isClosed: false, note: "" },
  });

  useEffect(() => {
    if (!open || !day) return;
    reset({
      capacity: day.capacity,
      isClosed: day.isClosed,
      note: day.note ?? "",
    });
  }, [open, day, reset]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["park-days"] });
    queryClient.invalidateQueries({ queryKey: ["park-dashboard"] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: ParkDayValues) =>
      upsertParkDayServerFn({
        data: {
          date: day!.date,
          capacity: values.capacity,
          isClosed: values.isClosed,
          note: values.note || undefined,
        },
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Availability saved");
      onOpenChange(false);
    },
    // 400 when the cap is below the tickets already sold for the day.
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to save"),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearParkDayServerFn({ data: { date: day!.date } }),
    onSuccess: () => {
      invalidate();
      toast.success("Reverted to the default capacity");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to clear"),
  });

  const pending = saveMutation.isPending || clearMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{day ? fmtDay(day.date) : "Day"}</DialogTitle>
          <DialogDescription>
            {day?.isDefault
              ? "This day runs on the default capacity. Saving creates an override just for it."
              : "This day has its own capacity override."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pd-capacity">Tickets available</FieldLabel>
              <Input
                id="pd-capacity"
                type="number"
                min={0}
                {...register("capacity", { valueAsNumber: true })}
              />
              <FieldError>{errors.capacity?.message}</FieldError>
              {day && day.sold > 0 && (
                <p className="text-muted-foreground text-xs">
                  {day.sold} ticket(s) already sold — the cap can't go below
                  that.
                </p>
              )}
            </Field>
            <Controller
              control={control}
              name="isClosed"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Switch
                    id="pd-closed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="pd-closed">
                    Park closed this day
                  </FieldLabel>
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="pd-note">Note (optional)</FieldLabel>
              <Input
                id="pd-note"
                placeholder="Private event, maintenance…"
                {...register("note")}
              />
              <FieldError>{errors.note?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter className="sm:justify-between">
            {/* Only an existing override can be cleared; a default day has
                nothing to revert to. */}
            {day && !day.isDefault ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => clearMutation.mutate()}
                disabled={pending}
              >
                Use default
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
