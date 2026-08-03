import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BedDoubleIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PageHeading } from "~/components/page-heading";
import { EmptyState } from "../components/empty-state";
import { HotelSwitcher } from "../components/hotel-switcher";
import { RoomDialog } from "../components/room-dialog";
import { RoomTypeDetail } from "../components/room-type-detail";
import { RoomTypeRow } from "../components/room-type-row";
import { useCurrentHotel } from "../hooks/use-current-hotel";
import { hotelRoomsQueryOptions, roomTypesQueryOptions } from "../queries";
import { deleteRoomServerFn, deleteRoomTypeServerFn } from "../server";
import type { Room, RoomType } from "../types";

type SortKey = "name" | "price-asc" | "price-desc" | "occupancy";
type AvailabilityFilter = "all" | "available" | "full";

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
    <RoomsPageContent
      key={hotelId}
      hotelId={hotelId}
      hotels={hotels}
      onHotelChange={setHotelId}
    />
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
  const { data: roomTypes } = useSuspenseQuery(roomTypesQueryOptions(hotelId));
  const { data: rooms } = useSuspenseQuery(hotelRoomsQueryOptions(hotelId));

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");

  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [deletingRoomType, setDeletingRoomType] = useState<RoomType | null>(
    null,
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = roomTypes.filter((rt) => {
      if (term && !rt.name.toLowerCase().includes(term)) return false;
      if (availability === "available") return rt.availableRooms > 0;
      if (availability === "full")
        return rt.totalRooms > 0 && rt.availableRooms === 0;
      return true;
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return Number(a.basePricePerNight) - Number(b.basePricePerNight);
        case "price-desc":
          return Number(b.basePricePerNight) - Number(a.basePricePerNight);
        case "occupancy":
          return b.occupiedRooms - a.occupiedRooms;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [roomTypes, search, sort, availability]);

  // Fall back to the first visible type whenever the selection drops out.
  const selected =
    visible.find((rt) => rt.id === selectedId) ?? visible[0] ?? null;
  const roomsOfSelected = selected
    ? rooms.filter((r) => r.roomTypeId === selected.id)
    : [];

  const deleteRoomTypeMutation = useMutation({
    mutationFn: (id: number) => deleteRoomTypeServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roomTypesQueryOptions(hotelId).queryKey,
      });
      toast.success("Room type deleted");
      setDeletingRoomType(null);
      setSelectedId(null);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Failed to delete room type",
      ),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => deleteRoomServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hotelRoomsQueryOptions(hotelId).queryKey,
      });
      // Room counts live on the room type, so that list is stale too.
      queryClient.invalidateQueries({
        queryKey: roomTypesQueryOptions(hotelId).queryKey,
      });
      toast.success("Room deleted");
      setDeletingRoom(null);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete room"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading />
        <div className="flex items-center gap-2">
          <HotelSwitcher
            hotels={hotels}
            value={hotelId}
            onChange={onHotelChange}
          />
          <Button asChild>
            <Link to="/dashboard/hotel/rooms/new">
              <PlusIcon data-icon="inline-start" />
              Add room type
            </Link>
          </Button>
        </div>
      </div>

      {roomTypes.length === 0 ? (
        <EmptyState
          icon={BedDoubleIcon}
          title="No room types yet"
          description="Create a room type (e.g. Garden Villa, Beach Villa) with a nightly price, then add the physical rooms under it."
          action={
            <Button asChild>
              <Link to="/dashboard/hotel/rooms/new">
                <PlusIcon data-icon="inline-start" />
                Add room type
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1">
                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search room types"
                  aria-label="Search room types"
                  className="pl-9"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-44" aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="name">Name (A–Z)</SelectItem>
                    <SelectItem value="price-asc">Price (low first)</SelectItem>
                    <SelectItem value="price-desc">
                      Price (high first)
                    </SelectItem>
                    <SelectItem value="occupancy">Most occupied</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={availability}
                onValueChange={(v) => setAvailability(v as AvailabilityFilter)}
              >
                <SelectTrigger className="w-40" aria-label="Availability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="full">Fully booked</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {visible.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No room types match these filters.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {visible.map((rt) => (
                  <RoomTypeRow
                    key={rt.id}
                    roomType={rt}
                    selected={selected?.id === rt.id}
                    onSelect={() => setSelectedId(rt.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {selected && (
            <Card className="xl:sticky xl:top-6">
              <CardContent>
                <RoomTypeDetail
                  roomType={selected}
                  rooms={roomsOfSelected}
                  onAddRoom={() => {
                    setEditingRoom(null);
                    setRoomDialogOpen(true);
                  }}
                  onEditRoom={(room) => {
                    setEditingRoom(room);
                    setRoomDialogOpen(true);
                  }}
                  onDeleteRoom={setDeletingRoom}
                  onDelete={() => setDeletingRoomType(selected)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <RoomDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        hotelId={hotelId}
        roomTypes={roomTypes}
        room={editingRoom}
        defaultRoomTypeId={selected?.id}
      />
      <ConfirmDialog
        open={deletingRoomType != null}
        onOpenChange={(o) => !o && setDeletingRoomType(null)}
        title="Delete room type?"
        description={`"${deletingRoomType?.name}" will be permanently removed. Room types with rooms under them can't be deleted.`}
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
        onConfirm={() =>
          deletingRoom && deleteRoomMutation.mutate(deletingRoom.id)
        }
      />
    </div>
  );
}
