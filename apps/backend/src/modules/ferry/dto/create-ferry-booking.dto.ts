import { IsInt, IsPositive, Max, Min } from 'class-validator';

/**
 * A booking request. Everything that asserts something about the booking's
 * standing is server-controlled and absent here on purpose:
 *
 * - `bookingReference` / `totalAmount` are generated and computed on write.
 * - `status` always starts `pending`; only the issue/validate/cancel actions
 *   move it.
 * - `validatedBy` / `validatedAt` are written from the authenticated staff user
 *   at check-in — a client may never claim a pass was checked in, or by whom.
 */
export class CreateFerryBookingDto {
  @IsInt()
  @IsPositive()
  userId!: number;

  @IsInt()
  @IsPositive()
  scheduleId!: number;

  @IsInt()
  @IsPositive()
  hotelBookingId!: number;

  @IsInt()
  @Min(1)
  @Max(255)
  passengerCount!: number;
}
