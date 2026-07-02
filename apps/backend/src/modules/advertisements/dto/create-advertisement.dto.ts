import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const AD_PLACEMENTS = [
  'homepage',
  'sidebar',
  'checkout',
  'map',
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export class CreateAdvertisementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  image!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  targetUrl!: string;

  @IsIn(AD_PLACEMENTS, {
    message: `placement must be one of: ${AD_PLACEMENTS.join(', ')}`,
  })
  placement!: AdPlacement;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
