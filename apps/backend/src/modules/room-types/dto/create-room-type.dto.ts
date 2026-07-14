import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const DECIMAL = /^\d+(\.\d{1,2})?$/;

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Matches(DECIMAL, {
    message: 'basePricePerNight must be a decimal like 120.00',
  })
  basePricePerNight!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  maxOccupancy!: number;
}
