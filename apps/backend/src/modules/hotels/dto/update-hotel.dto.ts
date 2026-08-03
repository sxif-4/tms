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

/** All fields optional — only the provided ones are patched. */
export class UpdateHotelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** `null` unpins the hotel from the map; omit to leave it unchanged. */
  @IsOptional()
  @IsInt()
  @Min(1)
  mapLocationId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRooms?: number;

  /** Facilities this hotel offers. Omit to leave unchanged; [] clears. */
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  facilityIds?: number[];
}
