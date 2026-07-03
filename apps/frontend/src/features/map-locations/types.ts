export type LocationType =
  | "hotel"
  | "ferry_terminal"
  | "attraction"
  | "beach"
  | "restaurant"
  | "landmark";

export interface MapLocation {
  id: number;
  name: string;
  description: string;
  type: LocationType;
  /** decimal(10,7) returned as a string; parse with Number() for the map. */
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapLocationInput {
  name: string;
  description: string;
  type: LocationType;
  latitude: number;
  longitude: number;
}
