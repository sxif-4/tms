import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { hotelBookingsQueryOptions } from "../queries";
import { assignRoomServerFn } from "../server";
import type { HotelBooking, Room } from "../types";

/**
 * Lets staff pick a room of the booking's type at its hotel. Client-side
 * filtering to `status === 'available'` is a helpful narrowing only — the
 * backend re-validates true availability (including date overlap) on submit.
 */
export function AssignRoomDialog({
  open,
  onOpenChange,
  booking,
  rooms,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: HotelBooking | null;
  rooms: Room[];
}) {
  const queryClient = useQueryClient();
  const [roomId, setRoomId] = useState<string>("");

  const candidateRooms = booking
    ? rooms.filter((r) => r.roomTypeId === booking.roomTypeId)
    : [];
  const availableRooms = candidateRooms.filter((r) => r.status === "available");
  const roomsToShow = availableRooms.length > 0 ? availableRooms : candidateRooms;

  useEffect(() => {
    if (!open) return;
    setRoomId("");
  }, [open, booking]);

  const mutation = useMutation({
    mutationFn: () =>
      assignRoomServerFn({ data: { id: booking!.id, roomId: Number(roomId) } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-dashboard"] });
      toast.success("Room assigned");
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to assign room"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign a room</DialogTitle>
          <DialogDescription>
            {booking
              ? `Booking ${booking.bookingReference} · ${booking.roomTypeName}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="assign-room-select">Room</FieldLabel>
          {roomsToShow.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rooms of this type exist at this hotel yet.
            </p>
          ) : (
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger id="assign-room-select" className="w-full">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roomsToShow.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      Room {r.roomNumber}
                      {r.status !== "available" ? ` (${r.status})` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <FieldDescription>
            The server re-checks availability, including date overlaps, before
            confirming.
          </FieldDescription>
        </Field>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !roomId}
          >
            {mutation.isPending ? "Assigning…" : "Assign room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
