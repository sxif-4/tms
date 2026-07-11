import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LOCATION_TYPES, type LocationType } from './create-map-location.dto';

/** All fields optional — only the provided ones are patched. */
export class UpdateMapLocationDto {
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
  @IsIn(LOCATION_TYPES, {
    message: `type must be one of: ${LOCATION_TYPES.join(', ')}`,
  })
  type?: LocationType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  positionTop?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  positionLeft?: number;
}
