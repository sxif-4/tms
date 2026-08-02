import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import { type Room } from '../../shared/database/schema';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { RoomTypesRepository } from '../room-types/room-types.repository';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsRepository } from './rooms.repository';

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomsRepo: RoomsRepository,
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  async listByHotel(user: AuthenticatedUser, hotelId: number): Promise<Room[]> {
    await this.hotelAccess.assertHotelAccess(user, hotelId);
    return this.roomsRepo.findAllByHotel(hotelId);
  }

  async findById(user: AuthenticatedUser, id: number): Promise<Room> {
    const room = await this.roomsRepo.findById(id);
    if (!room) throw new NotFoundException(`Room #${id} not found`);
    await this.hotelAccess.assertHotelAccess(user, room.hotelId);
    return room;
  }

  async create(dto: CreateRoomDto, user: AuthenticatedUser): Promise<Room> {
    await this.hotelAccess.assertHotelAccess(user, dto.hotelId);
    await this.assertRoomTypeBelongsToHotel(dto.roomTypeId, dto.hotelId);

    let room: Room;
    try {
      room = await this.roomsRepo.create({
        hotelId: dto.hotelId,
        roomTypeId: dto.roomTypeId,
        roomNumber: dto.roomNumber,
        status: dto.status ?? 'available',
      });
    } catch {
      throw new ConflictException(
        `Room ${dto.roomNumber} already exists at this hotel`,
      );
    }

    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomCreated,
      subjectType: 'Room',
      subjectId: room.id,
      metadata: { hotelId: room.hotelId, roomNumber: room.roomNumber },
    });
    return room;
  }

  async update(
    id: number,
    dto: UpdateRoomDto,
    user: AuthenticatedUser,
  ): Promise<Room> {
    const room = await this.findById(user, id); // 404 + access check
    if (dto.roomTypeId != null) {
      await this.assertRoomTypeBelongsToHotel(dto.roomTypeId, room.hotelId);
    }

    let updated: Room | undefined;
    try {
      updated = await this.roomsRepo.update(id, dto);
    } catch {
      throw new ConflictException(
        `Room ${dto.roomNumber ?? room.roomNumber} already exists at this hotel`,
      );
    }
    if (!updated) throw new NotFoundException(`Room #${id} not found`);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomUpdated,
      subjectType: 'Room',
      subjectId: id,
    });
    return updated;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const room = await this.findById(user, id); // 404 + access check
    if (await this.roomsRepo.hasActiveBookings(id)) {
      throw new ConflictException(
        'Cannot delete a room with active or upcoming bookings',
      );
    }
    await this.roomsRepo.delete(id);
    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomDeleted,
      subjectType: 'Room',
      subjectId: id,
      metadata: { hotelId: room.hotelId, roomNumber: room.roomNumber },
    });
  }

  /**
   * Room types are per-hotel, so a room may only use one of its own hotel's
   * types. The FK alone can't express this — it only checks the type exists.
   */
  private async assertRoomTypeBelongsToHotel(
    roomTypeId: number,
    hotelId: number,
  ): Promise<void> {
    const roomType = await this.roomTypesRepo.findById(roomTypeId);
    if (!roomType) {
      throw new NotFoundException(`Room type #${roomTypeId} not found`);
    }
    if (roomType.hotelId !== hotelId) {
      throw new BadRequestException(
        'That room type belongs to a different hotel',
      );
    }
  }
}
