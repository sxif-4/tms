import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

/** All fields optional. `eventId` can't change — delete and recreate instead. */
export class UpdateEventScheduleDto {
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
