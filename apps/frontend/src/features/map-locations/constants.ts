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

/** Marker colours per type, used for the map pins. */
export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  hotel: "#2563eb",
  ferry_terminal: "#0891b2",
  attraction: "#db2777",
  beach: "#d97706",
  restaurant: "#16a34a",
  landmark: "#7c3aed",
};

/** Fallback map centre (matches the seeded island coordinates). */
export const DEFAULT_CENTER: [number, number] = [48.86, 2.33];
