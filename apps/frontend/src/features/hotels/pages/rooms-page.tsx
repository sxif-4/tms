import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { BedDoubleIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
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
import { EmptyState } from "../components/empty-state";
import { HotelSwitcher } from "../components/hotel-switcher";
import { RoomDialog } from "../components/room-dialog";
import { RoomStatusBadge } from "../components/room-status-badge";
import { RoomTypeDialog } from "../components/room-type-dialog";
import { gbp } from "../constants";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { hotelRoomsQueryOptions, roomTypesQueryOptions } from "../queries";
import { deleteRoomServerFn, deleteRoomTypeServerFn } from "../server";
import type { Room, RoomType } from "../types";

export function RoomsPage() {
  const { hotels, hotel, hotelId, setHotelId } = useCurrentHotel();

  if (!hotel || hotelId == null) {
    return (
      <EmptyState
        icon={BedDoubleIcon}
        title="No hotel assigned yet"
        description="Your account isn't assigned to a hotel yet. Ask an administrator to assign you to one to get started."
      />
    );
  }

  return (
    <RoomsPageContent hotelId={hotelId} hotels={hotels} onHotelChange={setHotelId} />
  );
}

function RoomsPageContent({
  hotelId,
  hotels,
  onHotelChange,
}: {
  hotelId: number;
  hotels: ReturnType<typeof useCurrentHotel>["hotels"];
  onHotelChange: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const { data: roomTypes } = useSuspenseQuery(roomTypesQueryOptions);
  const { data: rooms } = useSuspenseQuery(hotelRoomsQueryOptions(hotelId));

  const [roomTypeDialogOpen, setRoomTypeDialogOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [deletingRoomType, setDeletingRoomType] = useState<RoomType | null>(null);

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  const deleteRoomTypeMutation = useMutation({
    mutationFn: (id: number) => deleteRoomTypeServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomTypesQueryOptions.queryKey });
      toast.success("Room type deleted");
      setDeletingRoomType(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete room type"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => deleteRoomServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hotelRoomsQueryOptions(hotelId).queryKey,
      });
      toast.success("Room deleted");
      setDeletingRoom(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete room"),
  });

  const roomTypeNameById = new Map(roomTypes.map((rt) => [rt.id, rt.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">Rooms</h1>
          <p className="text-sm text-muted-foreground">
            Manage the room-type catalog and this hotel's room inventory.
          </p>
        </div>
        <HotelSwitcher hotels={hotels} value={hotelId} onChange={onHotelChange} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Room types</CardTitle>
            <CardDescription>
              Shared catalog used across every hotel.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingRoomType(null);
              setRoomTypeDialogOpen(true);
            }}
          >
            <PlusIcon data-icon="inline-start" />
            New room type
          </Button>
        </CardHeader>
        <CardContent>
          {roomTypes.length === 0 ? (
            <EmptyState
              icon={BedDoubleIcon}
              title="No room types yet"
              description="Create a room type (e.g. Standard, Deluxe, Suite) with a nightly price before adding rooms."
              action={
                <Button
                  onClick={() => {
                    setEditingRoomType(null);
                    setRoomTypeDialogOpen(true);
                  }}
                >
                  <PlusIcon data-icon="inline-start" />
                  New room type
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price / night</TableHead>
                  <TableHead>Max occupancy</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypes.map((rt) => (
                  <TableRow key={rt.id}>
                    <TableCell className="font-medium">{rt.name}</TableCell>
                    <TableCell className="tabular-nums">
                      {gbp(Number(rt.basePricePerNight))}
                    </TableCell>
                    <TableCell>{rt.maxOccupancy}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Edit room type"
                        onClick={() => {
                          setEditingRoomType(rt);
                          setRoomTypeDialogOpen(true);
                        }}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Delete room type"
                        onClick={() => setDeletingRoomType(rt)}
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

      {roomTypes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Rooms</CardTitle>
              <CardDescription>This hotel's physical room inventory.</CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingRoom(null);
                setRoomDialogOpen(true);
              }}
            >
              <PlusIcon data-icon="inline-start" />
              New room
            </Button>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <EmptyState
                icon={BedDoubleIcon}
                title="No rooms yet"
                description="Add physical rooms of each type to start accepting bookings."
                action={
                  <Button
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomDialogOpen(true);
                    }}
                  >
                    <PlusIcon data-icon="inline-start" />
                    New room
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.roomNumber}</TableCell>
                      <TableCell>
                        {roomTypeNameById.get(room.roomTypeId) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RoomStatusBadge status={room.status} />
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Edit room"
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomDialogOpen(true);
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Delete room"
                          onClick={() => setDeletingRoom(room)}
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
      )}

      <RoomTypeDialog
        open={roomTypeDialogOpen}
        onOpenChange={setRoomTypeDialogOpen}
        roomType={editingRoomType}
      />
      <RoomDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        hotelId={hotelId}
        roomTypes={roomTypes}
        room={editingRoom}
      />
      <ConfirmDialog
        open={deletingRoomType != null}
        onOpenChange={(o) => !o && setDeletingRoomType(null)}
        title="Delete room type?"
        description={`"${deletingRoomType?.name}" will be permanently removed. Room types in use by a room can't be deleted.`}
        confirmLabel="Delete"
        destructive
        pending={deleteRoomTypeMutation.isPending}
        onConfirm={() =>
          deletingRoomType && deleteRoomTypeMutation.mutate(deletingRoomType.id)
        }
      />
      <ConfirmDialog
        open={deletingRoom != null}
        onOpenChange={(o) => !o && setDeletingRoom(null)}
        title="Delete room?"
        description={`Room ${deletingRoom?.roomNumber} will be permanently removed. Rooms with active or upcoming bookings can't be deleted.`}
        confirmLabel="Delete"
        destructive
        pending={deleteRoomMutation.isPending}
        onConfirm={() => deletingRoom && deleteRoomMutation.mutate(deletingRoom.id)}
      />
    </div>
  );
}
