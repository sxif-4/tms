import type { AdPlacement } from "./types";

export const AD_PLACEMENTS: AdPlacement[] = [
  "homepage",
  "sidebar",
  "checkout",
  "map",
];

export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  homepage: "Homepage",
  sidebar: "Sidebar",
  checkout: "Checkout",
  map: "Map",
};
