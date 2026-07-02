import type { DiscountType, PromotionTargetType } from "./types";

export const DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed"];

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage",
  fixed: "Fixed amount",
};

export const TARGET_TYPES: PromotionTargetType[] = [
  "room_type",
  "event",
  "ferry_route",
];

export const TARGET_TYPE_LABELS: Record<PromotionTargetType, string> = {
  room_type: "Room type",
  event: "Event",
  ferry_route: "Ferry route",
};
