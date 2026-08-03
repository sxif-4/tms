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
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import { AmenityIcon } from "~/lib/amenity-icon";
import { imageUrl } from "~/lib/image-url";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";
import type { Room, RoomType } from "../types";
import { groupAmenities, occupancyPercent } from "../utils";
import { RoomStatusBadge } from "./room-status-badge";

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
          <h2 className="font-heading text-xl font-semibold">
            {roomType.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {gbp(Number(roomType.basePricePerNight))} per night ·{" "}
            {roomType.maxOccupancy} guests max
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalRooms === 0 ? (
            <Badge variant="outline">No rooms</Badge>
          ) : availableRooms === 0 ? (
            <Badge variant="destructive">Fully booked</Badge>
          ) : (
            <Badge variant="secondary">{availableRooms} available</Badge>
          )}
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
          <ul className="flex flex-col divide-y rounded-lg border">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="font-medium">{room.roomNumber}</span>
                <RoomStatusBadge status={room.status} />
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Edit room ${room.roomNumber}`}
                    onClick={() => onEditRoom(room)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Delete room ${room.roomNumber}`}
                    onClick={() => onDeleteRoom(room)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
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
