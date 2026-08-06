import { Building2Icon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { OccupancyPoint } from "~/features/reports/types";

/**
 * Forward occupancy per hotel, measured in room-nights rather than booking
 * count — two one-night stays in different weeks are not two full rooms.
 */
export function OccupancyCard({ data }: { data: OccupancyPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel occupancy</CardTitle>
        <CardDescription>Room-nights sold, next 30 days</CardDescription>
        <CardAction>
          <Building2Icon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-2">
        {data.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            No active hotels yet.
          </p>
        ) : (
          data.map((hotel) => (
            <Link
              key={hotel.hotelId}
              to="/dashboard/admin/hotels"
              className="flex flex-col gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium">
                  {hotel.hotelName}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {hotel.occupancy}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-[width]"
                  style={{ width: `${Math.min(hotel.occupancy, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {hotel.roomNightsBooked} of {hotel.roomNightsAvailable}{" "}
                room-nights · {hotel.rooms}{" "}
                {hotel.rooms === 1 ? "room" : "rooms"}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
