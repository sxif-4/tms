import { ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { imageUrl } from "~/lib/image-url";
import { formatCalendarDay } from "../booking-draft";
import { gbp } from "../constants";

export interface BookingSummaryData {
  hotelName: string;
  image?: string | null;
  roomTypeName?: string;
  /** Calendar days (`yyyy-MM-dd`), as carried in the booking draft. */
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  nights?: number;
  pricePerNight?: number;
  /** Server-priced total; overrides nights × pricePerNight when provided. */
  total?: number;
}

export function BookingSummaryPanel({
  summary,
  onGuestsChange,
  maxGuests = 10,
}: {
  summary: BookingSummaryData;
  /**
   * Makes the guests row editable in place. Passed on /book, withheld on
   * /checkout — that page is a review, and party size isn't something to change
   * on the pay step.
   */
  onGuestsChange?: (guests: number) => void;
  maxGuests?: number;
}) {
  const nights = summary.nights ?? 0;
  const pricePerNight = summary.pricePerNight ?? 0;
  const subtotal = nights * pricePerNight;
  const total = summary.total ?? subtotal;
  /*
   * Before dates are picked there is no total. Rendering "£0.00" reads as a
   * priced booking that happens to be free, which is worse than saying nothing.
   */
  const priced = nights > 0 && total > 0;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {summary.image && (
        <img
          src={imageUrl(summary.image)}
          alt=""
          className="aspect-5/2 w-full object-cover"
        />
      )}

      <div className="p-5">
        <p className="leading-snug font-semibold">{summary.hotelName}</p>
        {summary.roomTypeName && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {summary.roomTypeName}
          </p>
        )}

        <dl className="mt-4 space-y-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Stay</dt>
            <dd className="mt-1">
              {summary.checkIn && summary.checkOut ? (
                <span className="flex flex-wrap items-center gap-1.5 font-medium">
                  {formatCalendarDay(summary.checkIn)}
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  {formatCalendarDay(summary.checkOut)}
                </span>
              ) : (
                <span className="text-muted-foreground">Not selected yet</span>
              )}
            </dd>
          </div>

          {summary.guests != null && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">
                {onGuestsChange ? (
                  <label htmlFor="summary-guests">Guests</label>
                ) : (
                  "Guests"
                )}
              </dt>
              <dd>
                {onGuestsChange ? (
                  <Select
                    value={String(summary.guests)}
                    onValueChange={(value) => onGuestsChange(Number(value))}
                  >
                    <SelectTrigger id="summary-guests" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxGuests }, (_, i) => i + 1).map(
                        (n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? "guest" : "guests"}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="font-medium">{summary.guests}</span>
                )}
              </dd>
            </div>
          )}

          {nights > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Nights</dt>
              <dd className="font-medium">{nights}</dd>
            </div>
          )}
        </dl>

        {priced ? (
          <div className="mt-4 border-t pt-4">
            {pricePerNight > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {gbp(pricePerNight)} × {nights}{" "}
                  {nights === 1 ? "night" : "nights"}
                </span>
                <span className="tabular-nums">{gbp(subtotal)}</span>
              </div>
            )}
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="font-medium">Total</span>
              <span className="text-2xl font-bold tracking-tight tabular-nums">
                {gbp(total)}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
            Pick your dates to see the total.
          </p>
        )}
      </div>
    </div>
  );
}
