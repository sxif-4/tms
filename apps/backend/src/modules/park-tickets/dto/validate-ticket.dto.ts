import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The ticket reference the gate operator types into the check-in box. */
export class ValidateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ticketReference!: string;
}
