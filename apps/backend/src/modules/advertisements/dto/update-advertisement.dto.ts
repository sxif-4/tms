import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AD_PLACEMENTS, type AdPlacement } from './create-advertisement.dto';

/** All fields optional — only the provided ones are patched. */
export class UpdateAdvertisementDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  targetUrl?: string;

  @IsOptional()
  @IsIn(AD_PLACEMENTS, {
    message: `placement must be one of: ${AD_PLACEMENTS.join(', ')}`,
  })
  placement?: AdPlacement;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
