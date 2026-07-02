import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PromotionTargetDto } from './promotion-target.dto';

export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** decimal(10,2) as a plain string, e.g. "10" or "10.50". */
const DECIMAL = /^\d+(\.\d{1,2})?$/;

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  /** Coupon code; omit for an auto-applied promotion. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsIn(DISCOUNT_TYPES, {
    message: `discountType must be one of: ${DISCOUNT_TYPES.join(', ')}`,
  })
  discountType!: DiscountType;

  @Matches(DECIMAL, { message: 'discountValue must be a decimal like 10.00' })
  discountValue!: string;

  @IsOptional()
  @Matches(DECIMAL, { message: 'minSpend must be a decimal like 50.00' })
  minSpend?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  perUserLimit?: number;

  @IsDateString()
  validFrom!: string;

  @IsDateString()
  validTo!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionTargetDto)
  targets?: PromotionTargetDto[];
}
