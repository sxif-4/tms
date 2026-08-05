import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

/**
 * Staff edits to an existing booking — rebooking a passenger onto another
 * sailing, or correcting the head count. Both re-run the eligibility and
 * capacity rules, and `totalAmount` is always recomputed from the sailing's
 * current `basePrice`.
 *
 * Must be a class, not `Partial<CreateFerryBookingDto>`: Nest's ValidationPipe
 * skips any body whose metatype is `Object`, which silently disabled
 * `whitelist`/`forbidNonWhitelisted` on this route.
 *
 * Status is deliberately not editable here — see the issue/validate/cancel
 * actions.
 */
export class UpdateFerryBookingDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  scheduleId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(255)
  passengerCount?: number;
}
