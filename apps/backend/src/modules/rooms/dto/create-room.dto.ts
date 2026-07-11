import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const ROOM_STATUSES = [
  'available',
  'occupied',
  'maintenance',
  'out_of_service',
] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export class CreateRoomDto {
  @IsInt()
  @Min(1)
  hotelId!: number;

  @IsInt()
  @Min(1)
  roomTypeId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roomNumber!: string;

  @IsOptional()
  @IsIn(ROOM_STATUSES)
  status?: RoomStatus;
}
