import { BedDoubleIcon, ImageIcon, HouseIcon, UsersIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";
import type { RoomType } from "../types";
import { occupancyPercent } from "../utils";

/**
 * One row in the room-type list: photo, copy, price and the derived inventory
 * figures. Selecting it drives the detail panel beside the list.
 */
export function RoomTypeRow({
  roomType,
  selected,
  onSelect,
}: {
  roomType: RoomType;
  selected: boolean;
  onSelect: () => void;
}) {
  const { totalRooms, availableRooms, occupiedRooms } = roomType;
  const soldOut = totalRooms > 0 && availableRooms === 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full gap-4 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected ? "border-primary/40 bg-accent/60" : "bg-card",
      )}
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28">
        {roomType.image ? (
          <img
            src={roomType.image}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <h3 className="font-heading text-base font-semibold">
            {roomType.name}
          </h3>
          <div className="flex items-center gap-2">
            {totalRooms === 0 ? (
              <Badge variant="outline">No rooms</Badge>
            ) : soldOut ? (
              <Badge variant="destructive">Fully booked</Badge>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">
                  {availableRooms} left
                </span>
                <Badge variant="secondary">Available</Badge>
              </>
            )}
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {roomType.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <UsersIcon className="size-3.5" />
            {roomType.maxOccupancy} guests
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDoubleIcon className="size-3.5" />
            {totalRooms} {totalRooms === 1 ? "room" : "rooms"}
          </span>
          {totalRooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <HouseIcon className="size-3.5" />
              {occupiedRooms} / {totalRooms} —{" "}
              {occupancyPercent(occupiedRooms, totalRooms)}%
            </span>
          )}
          <span className="ml-auto text-base font-semibold text-foreground tabular-nums">
            {gbp(Number(roomType.basePricePerNight))}
            <span className="text-xs font-normal text-muted-foreground">
              /night
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
