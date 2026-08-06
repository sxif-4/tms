import type { AdPlacement } from "./types";

/**
 * Where an ad can run. Only the homepage slider renders ads today — `sidebar`,
 * `checkout` and `map` used to be offered here but had no surface behind them,
 * so choosing one produced an ad no visitor ever saw.
 */
export const AD_PLACEMENTS: AdPlacement[] = ["homepage"];

export const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  homepage: "Homepage",
};
