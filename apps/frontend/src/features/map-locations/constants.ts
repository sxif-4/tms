import { z } from "zod";
import type { LocationType } from "./types";

export const LOCATION_TYPES: LocationType[] = [
  "hotel",
  "ferry_terminal",
  "attraction",
  "beach",
  "restaurant",
  "landmark",
];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  hotel: "Hotel",
  ferry_terminal: "Ferry terminal",
  attraction: "Attraction",
  beach: "Beach",
  restaurant: "Restaurant",
  landmark: "Landmark",
};

/**
 * Pin colours per type — CSS var references only, never literal hex, so the
 * map stays theme-consistent in light/dark mode.
 */
export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  hotel: "var(--series-hotel)",
  ferry_terminal: "var(--series-ferry)",
  attraction: "var(--chart-3)",
  beach: "var(--chart-4)",
  restaurant: "var(--chart-1)",
  landmark: "var(--chart-5)",
};

/** Static island artwork every map view (admin + visitor) renders pins over. */
export const ISLAND_MAP_IMAGE_SRC = "/images/map/Map_of_Island.png";

/**
 * Search-param shape for `/map` — a superset of `/hotels`' `{ minPrice,
 * maxPrice, guests }` (see `features/hotel-browsing`) plus a `type` filter,
 * so the two pages can share filter state via `Link`/`navigate` search.
 */
export const mapSearchSchema = z.object({
  type: z.enum(LOCATION_TYPES as [LocationType, ...LocationType[]]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  guests: z.number().optional(),
});
export type MapSearch = z.infer<typeof mapSearchSchema>;
