import { IsDateString, IsInt, Max, Min } from 'class-validator';

/** Visitor online purchase. The buyer is always the authenticated user. */
export class CreateParkTicketDto {
  @IsInt()
  @Min(1)
  ticketTypeId!: number;

  @IsDateString()
  visitDate!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}
