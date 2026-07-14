import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Walk-up sale at the gate. The customer may have no account, so `name`/`email`
 * identify them — the service finds or creates a visitor user from these.
 */
export class GateSaleDto {
  @IsInt()
  @Min(1)
  ticketTypeId!: number;

  @IsDateString()
  visitDate!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;
}
