export type DiscountType = "percentage" | "fixed";
export type PromotionTargetType = "room_type" | "event" | "ferry_route";

export interface PromotionTarget {
  id: number;
  promotionId: number;
  targetType: PromotionTargetType;
  targetId: number;
}

export interface Promotion {
  id: number;
  name: string;
  description: string;
  code: string | null;
  discountType: DiscountType;
  discountValue: string;
  minSpend: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  targets: PromotionTarget[];
}

export interface PromotionUsage {
  id: number;
  promotionId: number;
  userId: number;
  appliedToType: string;
  appliedToId: number;
  discountAmount: string;
  createdAt: string;
}

export interface PromotionTargetInput {
  targetType: PromotionTargetType;
  targetId: number;
}

export interface PromotionInput {
  name: string;
  description: string;
  code?: string;
  discountType: DiscountType;
  discountValue: string;
  minSpend?: string;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  targets: PromotionTargetInput[];
}
