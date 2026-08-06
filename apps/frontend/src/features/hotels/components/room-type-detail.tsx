import { Link } from "@tanstack/react-router";
import {
  BedDoubleIcon,
  CheckIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { AmenityIcon } from "~/lib/amenity-icon";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import {
  gbp,
  ROOM_STATUS_LABELS,
  ROOM_STATUSES,
  roomStatusBadgeVariant,
} from "../constants";
import type { Room, RoomStatus, RoomType } from "../types";
import { groupAmenities, occupancyPercent } from "../utils";

/**
 * Everything known about the selected room type: gallery, live occupancy, the
 * amenities it includes, and the physical rooms stocked under it.
 */
export function RoomTypeDetail({
  roomType,
  rooms,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onDelete,
}: {
  roomType: RoomType;
  rooms: Room[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onDelete: () => void;
}) {
  const images = roomType.images ?? [];
  const [activeImage, setActiveImage] = useState(0);

  // Reset the gallery when a different type is selected.
  useEffect(() => setActiveImage(0), [roomType.id]);

  const { totalRooms, availableRooms, occupiedRooms, outOfServiceRooms } =
    roomType;
  const percent = occupancyPercent(occupiedRooms, totalRooms);
  const amenityGroups = groupAmenities(roomType.amenities);
  const hero = images[activeImage] ?? roomType.image ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {roomType.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {roomType.maxOccupancy} guests max
          </p>
        </div>
        {/* Same ranking as the list rows: rate is a headline number, not a
            line of muted copy. */}
        <div className="flex flex-col items-end gap-2">
          {totalRooms === 0 ? (
            <Badge variant="outline">No rooms</Badge>
          ) : availableRooms === 0 ? (
            <Badge variant="destructive">Fully booked</Badge>
          ) : (
            <Badge variant="secondary">{availableRooms} available</Badge>
          )}
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {gbp(Number(roomType.basePricePerNight))}
            <span className="text-xs font-normal text-muted-foreground">
              /night
            </span>
          </span>
        </div>
      </div>

      {totalRooms > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {occupiedRooms} / {totalRooms} rooms occupied
            </span>
            <span className="font-medium tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} />
          {outOfServiceRooms > 0 && (
            <p className="text-xs text-muted-foreground">
              {outOfServiceRooms} out of service
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="aspect-video overflow-hidden rounded-xl bg-muted">
          {hero ? (
            <img
              src={imageUrl(hero)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="size-6" />
              <span className="text-xs">No photos yet</span>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`Show photo ${i + 1}`}
                className={cn(
                  "size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  i === activeImage ? "border-brand" : "border-transparent",
                )}
              >
                <img
                  src={imageUrl(url)}
                  alt=""
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UsersIcon className="size-4" />
          {roomType.maxOccupancy} guests
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BedDoubleIcon className="size-4" />
          {totalRooms} {totalRooms === 1 ? "room" : "rooms"}
        </span>
      </div>

      <p className="text-sm leading-relaxed">{roomType.description}</p>

      {amenityGroups.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-4">
            {amenityGroups.map((group) => (
              <div key={group.category} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">{group.label}</h3>
                <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {group.items.map((amenity) => (
                    <li
                      key={amenity.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckIcon className="size-3.5 shrink-0 text-brand" />
                      <AmenityIcon name={amenity.icon} />
                      {amenity.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Rooms of this type</h3>
          <Button size="sm" variant="outline" onClick={onAddRoom}>
            <PlusIcon data-icon="inline-start" />
            Add room
          </Button>
        </div>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rooms yet — this type can't be booked until you add at least one.
          </p>
        ) : (
          <RoomChipGrid
            onDeleteRoom={onDeleteRoom}
            onEditRoom={onEditRoom}
            rooms={rooms}
          />
        )}
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link
            to="/dashboard/hotel/rooms/$roomTypeId"
            params={{ roomTypeId: String(roomType.id) }}
          >
            <PencilIcon data-icon="inline-start" />
            Edit details
          </Link>
        </Button>
        <Button variant="outline" onClick={onDelete}>
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      </div>
    </div>
  );
}

/**
 * Rooms as chips rather than rows. A room is a number and a status, so a row
 * per room spends ~44px on data worth a chip — at 20+ rooms that buries the
 * rest of the panel. The status counts double as filters, which is how staff
 * actually use this list ("which rooms are down?").
 */
function RoomChipGrid({
  rooms,
  onEditRoom,
  onDeleteRoom,
}: {
  rooms: Room[];
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}) {
  const [filter, setFilter] = useState<RoomStatus | "all">("all");

  const counts = ROOM_STATUSES.map((status) => ({
    status,
    count: rooms.filter((room) => room.status === status).length,
  })).filter((entry) => entry.count > 0);

  // A filter that no longer matches anything (last maintenance room fixed)
  // would strand the user on an empty grid.
  const active = counts.some((entry) => entry.status === filter)
    ? filter
    : "all";
  const visible =
    active === "all" ? rooms : rooms.filter((room) => room.status === active);

  return (
    <div className="flex flex-col gap-3">
      {counts.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            active={active === "all"}
            onClick={() => setFilter("all")}
          >
            All {rooms.length}
          </FilterChip>
          {counts.map((entry) => (
            <FilterChip
              active={active === entry.status}
              key={entry.status}
              onClick={() => setFilter(entry.status)}
            >
              {/* Fall back to the raw status: an unmapped one should still
                  label its chip, not take the page down. */}
              {entry.count}{" "}
              {(ROOM_STATUS_LABELS[entry.status] ?? entry.status).toLowerCase()}
            </FilterChip>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex flex-wrap gap-2",
          // Safety valve for a property with far more rooms than fit a panel.
          visible.length > 40 && "max-h-72 overflow-y-auto pr-1",
        )}
      >
        {visible.map((room) => (
          <DropdownMenu key={room.id}>
            <DropdownMenuTrigger asChild>
              <Badge
                asChild
                className="h-8 min-w-16 cursor-pointer px-3 text-sm"
                variant={roomStatusBadgeVariant(room.status)}
              >
                <button
                  aria-label={`Room ${room.roomNumber} — ${ROOM_STATUS_LABELS[room.status]}`}
                  title={ROOM_STATUS_LABELS[room.status]}
                  type="button"
                >
                  {room.roomNumber}
                </button>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-muted-foreground">
                Room {room.roomNumber} · {ROOM_STATUS_LABELS[room.status]}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onEditRoom(room)}>
                <PencilIcon />
                Edit room
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDeleteRoom(room)}
                variant="destructive"
              >
                <Trash2Icon />
                Delete room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      aria-pressed={active}
      onClick={onClick}
      size="sm"
      variant={active ? "default" : "outline"}
    >
      {children}
    </Button>
  );
}
