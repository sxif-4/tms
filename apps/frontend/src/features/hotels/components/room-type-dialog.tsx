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
import { Textarea } from "~/components/ui/textarea";
import { roomTypesQueryOptions } from "../queries";
import { createRoomTypeServerFn, updateRoomTypeServerFn } from "../server";
import type { RoomType } from "../types";

const DECIMAL = /^\d+(\.\d{1,2})?$/;

const roomTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  description: z.string().trim().min(1, "Description is required"),
  basePricePerNight: z
    .string()
    .trim()
    .regex(DECIMAL, "Enter a decimal amount like 120.00"),
  maxOccupancy: z
    .number({ error: "Enter a number" })
    .int("Must be a whole number")
    .min(1, "At least 1 guest")
    .max(20, "At most 20 guests"),
});
type RoomTypeValues = z.infer<typeof roomTypeSchema>;

export function RoomTypeDialog({
  open,
  onOpenChange,
  roomType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomType: RoomType | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = roomType != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomTypeValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      basePricePerNight: "",
      maxOccupancy: 2,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: roomType?.name ?? "",
      description: roomType?.description ?? "",
      basePricePerNight: roomType?.basePricePerNight ?? "",
      maxOccupancy: roomType?.maxOccupancy ?? 2,
    });
  }, [open, roomType, reset]);

  const mutation = useMutation({
    mutationFn: (values: RoomTypeValues) =>
      isEdit
        ? updateRoomTypeServerFn({ data: { id: roomType.id, ...values } })
        : createRoomTypeServerFn({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roomTypesQueryOptions.queryKey,
      });
      toast.success(isEdit ? "Room type updated" : "Room type created");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit room type" : "New room type"}</DialogTitle>
          <DialogDescription>
            Room types are a shared catalog used across the hotel.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rt-name">Name</FieldLabel>
              <Input id="rt-name" {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="rt-description">Description</FieldLabel>
              <Textarea id="rt-description" rows={3} {...register("description")} />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="rt-price">Price / night (£)</FieldLabel>
                <Input
                  id="rt-price"
                  placeholder="120.00"
                  {...register("basePricePerNight")}
                />
                <FieldError>{errors.basePricePerNight?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="rt-occupancy">Max occupancy</FieldLabel>
                <Input
                  id="rt-occupancy"
                  type="number"
                  min={1}
                  max={20}
                  {...register("maxOccupancy", { valueAsNumber: true })}
                />
                <FieldError>{errors.maxOccupancy?.message}</FieldError>
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
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
