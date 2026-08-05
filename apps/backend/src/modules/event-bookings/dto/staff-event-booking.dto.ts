import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Desk booking made by park staff for a guest standing in front of them.
 *
 * Takes the ticket *reference* rather than an id because that is what is
 * printed on the ticket the guest hands over — the same thing the gate screen
 * reads. Staff never see internal ids.
 */
export class StaffEventBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  ticketReference!: string;

  @IsInt()
  @Min(1)
  eventScheduleId!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}
