import type { RoomTypeAmenity } from "./types";

/** Occupancy as a whole percentage; 0 when the type has no rooms. */
export function occupancyPercent(occupied: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((occupied / total) * 100);
}

const CATEGORY_LABELS: Record<string, string> = {
  comfort: "Comfort",
  bathroom: "Bathroom",
  view: "View",
  outdoor: "Outdoor",
  tech: "Technology",
  dining: "Dining",
};

export function amenityCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Groups amenities by category, preserving the order the API returned. */
export function groupAmenities(
  amenities: RoomTypeAmenity[] | undefined,
): { category: string; label: string; items: RoomTypeAmenity[] }[] {
  const groups = new Map<string, RoomTypeAmenity[]>();
  for (const amenity of amenities ?? []) {
    const existing = groups.get(amenity.category);
    if (existing) existing.push(amenity);
    else groups.set(amenity.category, [amenity]);
  }
  return [...groups.entries()].map(([category, items]) => ({
    category,
    label: amenityCategoryLabel(category),
    items,
  }));
}
