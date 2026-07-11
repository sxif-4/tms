import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';

export const FERRY_BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'validated'] as const;
export type FerryBookingStatus = (typeof FERRY_BOOKING_STATUSES)[number];

export class CreateFerryBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  bookingReference!: string;

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

  @IsNumber()
  @Min(0)
  totalAmount!: number;

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
