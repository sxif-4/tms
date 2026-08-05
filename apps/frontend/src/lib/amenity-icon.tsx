import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Anchor,
  Baby,
  Bath,
  BedDouble,
  Car,
  Coffee,
  ConciergeBell,
  Dumbbell,
  Eye,
  Fish,
  Flower,
  Home,
  Plane,
  Shirt,
  ShowerHead,
  Sofa,
  TreePalm,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Wine,
} from "lucide-react";

/**
 * Maps seeded amenity/facility `icon` keys (kebab-case) to Lucide components.
 * Must stay in sync with the keys in `seeds/demo.ts` — an unmapped key renders
 * blank space rather than a glyph, so a gap here is silent.
 */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  anchor: Anchor,
  baby: Baby,
  bath: Bath,
  "bed-double": BedDouble,
  car: Car,
  coffee: Coffee,
  "concierge-bell": ConciergeBell,
  dumbbell: Dumbbell,
  eye: Eye,
  fish: Fish,
  flower: Flower,
  home: Home,
  plane: Plane,
  shirt: Shirt,
  "shower-head": ShowerHead,
  sofa: Sofa,
  "tree-palm": TreePalm,
  tv: Tv,
  utensils: Utensils,
  waves: Waves,
  wifi: Wifi,
  wind: Wind,
  wine: Wine,
};

export function AmenityIcon({
  name,
  className = "size-3.5 shrink-0",
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = name ? AMENITY_ICONS[name] : undefined;
  /*
   * An unmapped key reserves the icon's box instead of falling back to a "?"
   * glyph: a column of question marks reads as failed data, while empty space
   * just keeps the labels on one alignment.
   */
  if (!Icon)
    return <span className={cn("inline-block", className)} aria-hidden />;
  return <Icon className={className} aria-hidden />;
}
