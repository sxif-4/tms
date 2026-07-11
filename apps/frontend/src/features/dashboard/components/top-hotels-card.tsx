import { Building2Icon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { OverviewThumbnail } from "./overview-thumbnail";
import { Sparkline } from "./sparkline";
import { TOP_HOTELS } from "../mock";

export function TopHotelsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top occupied hotels</CardTitle>
        <CardDescription>Highest occupancy right now</CardDescription>
        <CardAction>
          <Building2Icon className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-2">
        {TOP_HOTELS.map((hotel) => (
          <div
            key={hotel.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
          >
            <OverviewThumbnail
              image={hotel.image}
              alt={hotel.name}
              icon={Building2Icon}
              accent={hotel.accent}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{hotel.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {hotel.location}
              </p>
            </div>
            <Sparkline
              data={hotel.trend}
              color={hotel.accent}
              className="hidden shrink-0 sm:block"
            />
            <div className="flex w-12 flex-col items-end">
              <span className="text-sm font-semibold tabular-nums">
                {hotel.occupancy}%
              </span>
              <span className="text-xs text-muted-foreground">occupied</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
