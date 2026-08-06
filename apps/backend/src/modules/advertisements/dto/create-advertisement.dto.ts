import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Only surfaces that actually render ads belong here. `sidebar`, `checkout`
 * and `map` were listed once but nothing ever requested them, so an ad saved
 * against one was stored, listed in the admin table, and shown to nobody.
 * Add a value back the same day the surface that renders it ships.
 */
export const AD_PLACEMENTS = ['homepage'] as const;
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
