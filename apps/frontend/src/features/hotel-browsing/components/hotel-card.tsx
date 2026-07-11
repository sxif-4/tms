import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { gbp, hotelImage } from "../constants";
import type { HotelSummary } from "../types";

export function HotelCard({ hotel }: { hotel: HotelSummary }) {
  return (
    <Card className="group overflow-hidden p-0 transition-shadow hover:shadow-lg">
      <Link
        to="/hotels/$hotelId"
        params={{ hotelId: String(hotel.id) }}
        className="block"
      >
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <img
            src={hotelImage(hotel)}
            alt={hotel.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>

      <CardContent className="space-y-2 p-4">
        <Link to="/hotels/$hotelId" params={{ hotelId: String(hotel.id) }}>
          <h3 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
            {hotel.name}
          </h3>
        </Link>
        {hotel.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {hotel.description}
          </p>
        )}
        {(hotel.positionTop || hotel.positionLeft) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            On the island map
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/30 p-4">
        <div>
          <p className="text-xs text-muted-foreground">From</p>
          <p className="text-lg font-semibold">
            {hotel.minPrice != null ? (
              <>
                {gbp(hotel.minPrice)}
                <span className="text-sm font-normal text-muted-foreground">
                  /night
                </span>
              </>
            ) : (
              <span className="text-base font-medium text-muted-foreground">
                Price on request
              </span>
            )}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/hotels/$hotelId" params={{ hotelId: String(hotel.id) }}>
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
