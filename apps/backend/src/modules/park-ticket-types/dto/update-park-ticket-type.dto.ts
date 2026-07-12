import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

/** All fields optional — only the provided ones are patched. */
export class UpdateParkTicketTypeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Matches(DECIMAL, { message: 'price must be a decimal like 45.00' })
  price?: string;
}
