import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const LOCATION_TYPES = [
  'hotel',
  'ferry_terminal',
  'attraction',
  'beach',
  'restaurant',
  'landmark',
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export class CreateMapLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(LOCATION_TYPES, {
    message: `type must be one of: ${LOCATION_TYPES.join(', ')}`,
  })
  type!: LocationType;

  /** Percentage position over the static island map image (0-100). */
  @IsNumber()
  @Min(0)
  @Max(100)
  positionTop!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  positionLeft!: number;
}
