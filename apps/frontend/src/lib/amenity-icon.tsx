import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  Bath,
  BedDouble,
  Coffee,
  ConciergeBell,
  Eye,
  Fish,
  Home,
  ShowerHead,
  Sofa,
  TreePalm,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
  Wine,
  CircleHelp,
} from "lucide-react";

/** Maps seeded amenity `icon` keys (kebab-case) to Lucide components. */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  wind: Wind,
  wine: Wine,
  waves: Waves,
  "shower-head": ShowerHead,
  eye: Eye,
  "tree-palm": TreePalm,
  "bed-double": BedDouble,
  sofa: Sofa,
  "concierge-bell": ConciergeBell,
  fish: Fish,
  bath: Bath,
  coffee: Coffee,
  tv: Tv,
  home: Home,
  anchor: Anchor,
  utensils: Utensils,
};

export function AmenityIcon({
  name,
  className = "size-3.5 shrink-0",
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = (name && AMENITY_ICONS[name]) || CircleHelp;
  return <Icon className={className} aria-hidden />;
}
