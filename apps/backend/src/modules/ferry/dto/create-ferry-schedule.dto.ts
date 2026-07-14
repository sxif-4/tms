import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const FERRY_DIRECTIONS = ['to_theme_park', 'to_island'] as const;
export const FERRY_SCHEDULE_STATUSES = [
  'scheduled',
  'departed',
  'cancelled',
] as const;
export type FerryDirection = (typeof FERRY_DIRECTIONS)[number];
export type FerryScheduleStatus = (typeof FERRY_SCHEDULE_STATUSES)[number];

export class CreateFerryScheduleDto {
  @IsInt()
  @IsPositive()
  routeId!: number;

  @IsDateString()
  departureAt!: string;

  @IsIn(FERRY_DIRECTIONS, {
    message: `direction must be one of: ${FERRY_DIRECTIONS.join(', ')}`,
  })
  direction!: FerryDirection;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsIn(FERRY_SCHEDULE_STATUSES, {
    message: `status must be one of: ${FERRY_SCHEDULE_STATUSES.join(', ')}`,
  })
  status!: FerryScheduleStatus;
}
