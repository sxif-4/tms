export type AdPlacement = "homepage" | "sidebar" | "checkout" | "map";

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
