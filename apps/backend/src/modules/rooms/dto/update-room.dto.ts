import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ROOM_STATUSES, type RoomStatus } from './create-room.dto';

/** All fields optional — only the provided ones are patched. hotelId can't change (delete + recreate instead). */
export class UpdateRoomDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  roomTypeId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roomNumber?: string;

  @IsOptional()
  @IsIn(ROOM_STATUSES)
  status?: RoomStatus;
}
