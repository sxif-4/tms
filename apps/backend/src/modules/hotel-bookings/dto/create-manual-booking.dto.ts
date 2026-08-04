import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Staff may open a booking unpaid (`pending`) or take payment now (`confirmed`). */
export const MANUAL_BOOKING_STATUSES = ['pending', 'confirmed'] as const;
export type ManualBookingStatus = (typeof MANUAL_BOOKING_STATUSES)[number];

/** Matches `payments.method` — only recorded when payment is taken. */
export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** How the booking reached the desk. Online bookings leave this null. */
export const BOOKING_SOURCES = [
  'walk_in',
  'phone',
  'email',
  'corporate',
  'ota',
] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

/** `HH:MM`, 24-hour. */
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Booking taken at the front desk. The guest may have no account, so
 * `name`/`email` identify them — the service finds or creates a visitor from
 * these. `bookingReference` and `totalAmount` are always server-computed.
 */
export class CreateManualBookingDto {
  @IsInt()
  @Min(1)
  hotelId!: number;

  @IsInt()
  @Min(1)
  roomTypeId!: number;

  @IsISO8601()
  checkIn!: string;

  @IsISO8601()
  checkOut!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  guests!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  /** Only used when the email is new — a returning guest keeps their own. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /** Optional — desk staff often know the room already. Left null otherwise. */
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number;

  @IsOptional()
  @IsIn(MANUAL_BOOKING_STATUSES, {
    message: `status must be one of: ${MANUAL_BOOKING_STATUSES.join(', ')}`,
  })
  status?: ManualBookingStatus;

  /** Ignored unless `status` is `confirmed` — nothing was collected otherwise. */
  @IsOptional()
  @IsIn(PAYMENT_METHODS, {
    message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`,
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsIn(BOOKING_SOURCES, {
    message: `source must be one of: ${BOOKING_SOURCES.join(', ')}`,
  })
  source?: BookingSource;

  @IsOptional()
  @Matches(TIME_24H, { message: 'arrivalTime must be HH:MM' })
  arrivalTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  specialRequests?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  internalNotes?: string;
}
