import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** What the jetty operator types (or pastes from a scanned QR) into the boarding box. */
export class ValidateFerryPassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  bookingReference!: string;
}
