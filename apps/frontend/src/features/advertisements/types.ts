/** Only surfaces that actually render ads. Mirrors `AD_PLACEMENTS` on the API. */
export type AdPlacement = "homepage";

export interface Advertisement {
  id: number;
  title: string;
  image: string;
  targetUrl: string;
  placement: AdPlacement;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementInput {
  title: string;
  image: string;
  targetUrl: string;
  placement: AdPlacement;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}
