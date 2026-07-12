import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

export class CreateParkTicketTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @Matches(DECIMAL, { message: 'price must be a decimal like 45.00' })
  price!: string;
}
