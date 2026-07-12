import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  EVENT_TYPES,
  LOCATION_TYPES,
  type EventType,
  type LocationType,
} from './create-event.dto';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

/** All fields optional — only the provided ones are patched. */
export class UpdateEventDto {
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
  @IsIn(EVENT_TYPES)
  eventType?: EventType;

  @IsOptional()
  @IsIn(LOCATION_TYPES)
  locationType?: LocationType;

  @IsOptional()
  @Matches(DECIMAL, { message: 'basePrice must be a decimal like 12.50' })
  basePrice?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
