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

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
