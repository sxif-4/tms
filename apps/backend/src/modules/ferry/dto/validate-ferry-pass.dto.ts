import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The booking reference the jetty operator types into the boarding box. */
export class ValidateFerryPassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  bookingReference!: string;
}
