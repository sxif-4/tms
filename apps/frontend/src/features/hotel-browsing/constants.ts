import { z } from "zod";
import { gbp } from "~/features/reports/constants";
import {
  LOCATION_TYPES,
} from "~/features/map-locations/constants";
import type { LocationType } from "~/features/map-locations/types";
import type { AvailabilityLevel, HotelBookingStatus, HotelSummary } from "./types";

export { gbp };

/** Shared with `/map` so filter state carries over via `Link` search params. */
export const hotelSearchSchema = z.object({
  type: z.enum(LOCATION_TYPES as [LocationType, ...LocationType[]]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  guests: z.number().optional(),
});
export type HotelSearch = z.infer<typeof hotelSearchSchema>;

export const BOOKING_STATUS_LABELS: Record<HotelBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const BOOKING_STATUS_VARIANTS: Record<
  HotelBookingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "outline",
};

/** Health-bar tier → semantic Tailwind class. Never a literal traffic-light color. */
export const AVAILABILITY_TIER_CLASS: Record<AvailabilityLevel, string> = {
  high: "bg-primary/70",
  medium: "bg-accent-foreground/60",
  low: "bg-destructive/70",
  none: "bg-muted",
};

/** Human label per tier so availability isn't communicated by color alone. */
export const AVAILABILITY_TIER_LABEL: Record<AvailabilityLevel, string> = {
  high: "Plenty available",
  medium: "Limited availability",
  low: "Almost full",
  none: "Fully booked",
};

/** Deterministic fallback images for hotels the API returns with `image: null`. */
export const HOTEL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1578922746465-3a80a228f223?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
];

export function hotelImage(hotel: Pick<HotelSummary, "id" | "image">): string {
  return (
    hotel.image ??
    HOTEL_FALLBACK_IMAGES[hotel.id % HOTEL_FALLBACK_IMAGES.length]
  );
}
