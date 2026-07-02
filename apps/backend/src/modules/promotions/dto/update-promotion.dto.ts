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
import { DISCOUNT_TYPES, type DiscountType } from './create-promotion.dto';
import { PromotionTargetDto } from './promotion-target.dto';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

/** All fields optional. Passing `targets` replaces the full target set. */
export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsIn(DISCOUNT_TYPES, {
    message: `discountType must be one of: ${DISCOUNT_TYPES.join(', ')}`,
  })
  discountType?: DiscountType;

  @IsOptional()
  @Matches(DECIMAL, { message: 'discountValue must be a decimal like 10.00' })
  discountValue?: string;

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

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionTargetDto)
  targets?: PromotionTargetDto[];
}
