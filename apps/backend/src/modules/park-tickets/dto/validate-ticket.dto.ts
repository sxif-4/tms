import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** What the gate operator types (or pastes from a scanned QR) into the check-in box. */
export class ValidateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ticketReference!: string;
}
