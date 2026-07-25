import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export const FERRY_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'cancelled',
  'validated',
] as const;
export type FerryBookingStatus = (typeof FERRY_BOOKING_STATUSES)[number];

/** bookingReference and totalAmount are always server-generated/computed — never client input. */
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

  @IsOptional()
  @IsInt()
  @IsPositive()
  validatedBy?: number;

  @IsOptional()
  @IsDateString()
  validatedAt?: string;

  @IsIn(FERRY_BOOKING_STATUSES, {
    message: `status must be one of: ${FERRY_BOOKING_STATUSES.join(', ')}`,
  })
  status!: FerryBookingStatus;
}
