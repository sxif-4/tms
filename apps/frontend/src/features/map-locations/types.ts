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
  /** decimal(5,2) returned as a string — % position over Map_of_Island.png. */
  positionTop: string;
  positionLeft: string;
  createdAt: string;
  updatedAt: string;
}

export interface MapLocationInput {
  name: string;
  description: string;
  type: LocationType;
  positionTop: number;
  positionLeft: number;
}
