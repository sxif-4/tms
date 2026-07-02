import { IsIn, IsInt, IsPositive } from 'class-validator';

export const PROMOTION_TARGET_TYPES = [
  'room_type',
  'event',
  'ferry_route',
] as const;
export type PromotionTargetType = (typeof PROMOTION_TARGET_TYPES)[number];

export class PromotionTargetDto {
  @IsIn(PROMOTION_TARGET_TYPES, {
    message: `targetType must be one of: ${PROMOTION_TARGET_TYPES.join(', ')}`,
  })
  targetType!: PromotionTargetType;

  @IsInt()
  @IsPositive()
  targetId!: number;
}
