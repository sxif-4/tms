import { BedDouble, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { gbp } from "../constants";

/**
 * Common subset of `RoomType` and `RoomTypeAvailability` — `availableRooms` is
 * only known once a date range has been picked, so it's optional here and the
 * "available / sold out" line only renders when it's present.
 */
export interface RoomOptionSummary {
  roomTypeId: number;
  name: string;
  description: string;
  basePricePerNight: string;
  maxOccupancy: number;
  totalRooms: number;
  availableRooms?: number;
}

export function RoomOptionCard({
  room,
  selected = false,
  onSelect,
}: {
  room: RoomOptionSummary;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const soldOut = room.availableRooms != null && room.availableRooms <= 0;
  const interactive = Boolean(onSelect);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        selected && "border-primary ring-2 ring-primary/30",
        interactive && !selected && "hover:border-primary/40",
      )}
    >
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-semibold">{room.name}</p>
          <p className="text-sm text-muted-foreground">{room.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              Up to {room.maxOccupancy} guests
            </span>
            {room.availableRooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble className="size-3.5" />
                {soldOut
                  ? "Fully booked"
                  : `${room.availableRooms} of ${room.totalRooms} rooms available`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-lg font-semibold">
            {gbp(Number(room.basePricePerNight))}
            <span className="text-sm font-normal text-muted-foreground">
              /night
            </span>
          </p>
          {interactive && (
            <Button
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              disabled={soldOut}
              onClick={onSelect}
            >
              {selected ? "Selected" : soldOut ? "Sold out" : "Select"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
