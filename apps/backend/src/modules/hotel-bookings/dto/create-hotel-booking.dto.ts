import { IsInt, IsISO8601, Max, Min } from 'class-validator';

export class CreateHotelBookingDto {
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
}
