import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateEventScheduleDto {
  @IsInt()
  @Min(1)
  eventId!: number;

  @IsDateString()
  startAt!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}
