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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ROOM_STATUSES, ROOM_STATUS_LABELS } from "../constants";
import { hotelRoomsQueryOptions } from "../queries";
import { createRoomServerFn, updateRoomServerFn } from "../server";
import type { Room, RoomType } from "../types";

const roomSchema = z.object({
  roomTypeId: z.number().int().positive("Select a room type"),
  roomNumber: z.string().trim().min(1, "Room number is required").max(50),
  status: z.enum(["available", "occupied", "maintenance", "out_of_service"]),
});
type RoomValues = z.infer<typeof roomSchema>;

export function RoomDialog({
  open,
  onOpenChange,
  hotelId,
  roomTypes,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: number;
  roomTypes: RoomType[];
  room: Room | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = room != null;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomTypeId: roomTypes[0]?.id ?? 0,
      roomNumber: "",
      status: "available",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      roomTypeId: room?.roomTypeId ?? roomTypes[0]?.id ?? 0,
      roomNumber: room?.roomNumber ?? "",
      status: room?.status ?? "available",
    });
  }, [open, room, roomTypes, reset]);

  const mutation = useMutation({
    mutationFn: (values: RoomValues) =>
      isEdit
        ? updateRoomServerFn({ data: { id: room.id, ...values } })
        : createRoomServerFn({ data: { hotelId, ...values } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hotelRoomsQueryOptions(hotelId).queryKey,
      });
      toast.success(isEdit ? "Room updated" : "Room created");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit room" : "New room"}</DialogTitle>
          <DialogDescription>
            Rooms belong to this hotel and a room type from the catalog.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="room-number">Room number</FieldLabel>
              <Input id="room-number" placeholder="101" {...register("roomNumber")} />
              <FieldError>{errors.roomNumber?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="room-type">Room type</FieldLabel>
              <Controller
                control={control}
                name="roomTypeId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="room-type" className="w-full">
                      <SelectValue placeholder="Select a room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={String(rt.id)}>
                            {rt.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.roomTypeId?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="room-status">Status</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="room-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {ROOM_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ROOM_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.status?.message}</FieldError>
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
              {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
