import { BedDouble, CalendarDays, Hotel as HotelIcon, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { gbp } from "../constants";

export interface BookingSummaryData {
  hotelName: string;
  roomTypeName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  nights?: number;
  pricePerNight?: number;
  /** Overrides the computed nights × pricePerNight total when provided (e.g. the server-priced total). */
  total?: number;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BookingSummaryPanel({ summary }: { summary: BookingSummaryData }) {
  const nights = summary.nights ?? 0;
  const pricePerNight = summary.pricePerNight ?? 0;
  const subtotal = nights * pricePerNight;
  const total = summary.total ?? subtotal;

  return (
    <Card className="glass-data-strong overflow-hidden">
      <CardHeader className="border-b bg-transparent">
        <CardTitle className="text-base">Booking summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium">
            <HotelIcon className="size-4 text-primary" />
            {summary.hotelName}
          </p>
          {summary.roomTypeName && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <BedDouble className="size-4" />
              {summary.roomTypeName}
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              Dates
            </span>
            {summary.checkIn && summary.checkOut ? (
              <span className="text-right font-medium">
                {formatDate(summary.checkIn)}
                <br />
                {formatDate(summary.checkOut)}
              </span>
            ) : (
              <span className="text-muted-foreground/70">Select on calendar</span>
            )}
          </div>
          {summary.guests != null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                Guests
              </span>
              <span className="font-medium">{summary.guests}</span>
            </div>
          )}
        </div>

        {nights > 0 && pricePerNight > 0 && (
          <>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {gbp(pricePerNight)} × {nights} {nights === 1 ? "night" : "nights"}
              </span>
              <span>{gbp(subtotal)}</span>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <span className="font-medium">Total</span>
          <span className="text-xl font-semibold">{gbp(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
