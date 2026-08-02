import {
  IsArray,
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

export class CreateRoomTypeDto {
  /** Room types belong to one hotel; the caller must be assigned to it. */
  @IsInt()
  @Min(1)
  hotelId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Matches(DECIMAL, {
    message: 'basePricePerNight must be a decimal like 120.00',
  })
  basePricePerNight!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  maxOccupancy!: number;

  /** Amenities to attach on creation. Optional — defaults to none. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  amenityIds?: number[];
}
