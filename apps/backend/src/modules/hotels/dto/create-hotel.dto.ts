import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Pins the hotel to a spot on the island map. Optional — can be set later. */
  @IsOptional()
  @IsInt()
  @Min(1)
  mapLocationId?: number;

  @IsInt()
  @Min(1)
  maxRooms!: number;

  /** Facilities this hotel offers. Optional — defaults to none. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  facilityIds?: number[];
}
