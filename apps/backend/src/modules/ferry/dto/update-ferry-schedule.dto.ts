import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

import {
  FERRY_DIRECTIONS,
  FERRY_SCHEDULE_STATUSES,
  type FerryDirection,
  type FerryScheduleStatus,
} from './create-ferry-schedule.dto';

export class UpdateFerryScheduleDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  routeId?: number;

  @IsOptional()
  @IsDateString()
  departureAt?: string;

  @IsOptional()
  @IsIn(FERRY_DIRECTIONS, {
    message: `direction must be one of: ${FERRY_DIRECTIONS.join(', ')}`,
  })
  direction?: FerryDirection;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsIn(FERRY_SCHEDULE_STATUSES, {
    message: `status must be one of: ${FERRY_SCHEDULE_STATUSES.join(', ')}`,
  })
  status?: FerryScheduleStatus;
}
