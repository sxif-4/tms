import { IsInt, Max, Min } from 'class-validator';

/** Visitor books seats on an event schedule. A valid park ticket is a prerequisite. */
export class CreateEventBookingDto {
  @IsInt()
  @Min(1)
  eventScheduleId!: number;

  /** Must be a ticket the caller owns, active, and for the schedule's day. */
  @IsInt()
  @Min(1)
  parkTicketId!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}
