import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

/** All fields optional — only the provided ones are patched. */
export class UpdateRoomTypeDto {
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
  @Matches(DECIMAL, { message: 'basePricePerNight must be a decimal like 120.00' })
  basePricePerNight?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxOccupancy?: number;
}
