import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

export const EVENT_TYPES = ['ride', 'show', 'beach_event'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const LOCATION_TYPES = ['theme_park', 'beach'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(EVENT_TYPES)
  eventType!: EventType;

  @IsIn(LOCATION_TYPES)
  locationType!: LocationType;

  @Matches(DECIMAL, { message: 'basePrice must be a decimal like 12.50' })
  basePrice!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
