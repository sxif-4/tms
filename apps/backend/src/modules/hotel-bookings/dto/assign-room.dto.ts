import { IsInt, Min } from 'class-validator';

export class AssignRoomDto {
  @IsInt()
  @Min(1)
  roomId!: number;
}
