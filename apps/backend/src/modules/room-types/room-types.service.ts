import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import {
  RoomTypesRepository,
  type RoomTypeWithAmenities,
} from './room-types.repository';

/**
 * Room types belong to a single hotel, so every operation reduces to the same
 * question every other hotel-domain module asks: may this user act on that
 * hotel? `HotelAccessService` answers it; there is no cross-hotel case left.
 */
@Injectable()
export class RoomTypesService {
  constructor(
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  async listByHotel(
    user: AuthenticatedUser,
    hotelId: number,
  ): Promise<RoomTypeWithAmenities[]> {
    await this.hotelAccess.assertHotelAccess(user, hotelId);
    return this.roomTypesRepo.findByHotel(hotelId);
  }

  async findById(
    user: AuthenticatedUser,
    id: number,
  ): Promise<RoomTypeWithAmenities> {
    const roomType = await this.roomTypesRepo.findById(id);
    if (!roomType) throw new NotFoundException(`Room type #${id} not found`);
    await this.hotelAccess.assertHotelAccess(user, roomType.hotelId);
    return roomType;
  }

  async create(
    dto: CreateRoomTypeDto,
    user: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities> {
    await this.hotelAccess.assertHotelAccess(user, dto.hotelId);

    let roomType: RoomTypeWithAmenities;
    try {
      roomType = await this.roomTypesRepo.create({
        hotelId: dto.hotelId,
        name: dto.name,
        description: dto.description,
        basePricePerNight: dto.basePricePerNight,
        maxOccupancy: dto.maxOccupancy,
      });
    } catch {
      // Unique on (hotel_id, name) — same name is fine at a different hotel.
      throw new ConflictException(
        `This hotel already has a room type named "${dto.name}"`,
      );
    }

    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomTypeCreated,
      subjectType: 'RoomType',
      subjectId: roomType.id,
      metadata: { name: roomType.name, hotelId: roomType.hotelId },
    });
    return roomType;
  }

  async update(
    id: number,
    dto: UpdateRoomTypeDto,
    user: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities> {
    await this.findById(user, id); // 404 + access check

    let updated: RoomTypeWithAmenities | undefined;
    try {
      updated = await this.roomTypesRepo.update(id, dto);
    } catch {
      throw new ConflictException(
        `This hotel already has a room type named "${dto.name}"`,
      );
    }
    if (!updated) throw new NotFoundException(`Room type #${id} not found`);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomTypeUpdated,
      subjectType: 'RoomType',
      subjectId: id,
    });
    return updated;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const roomType = await this.findById(user, id); // 404 + access check

    // Rooms reference the type without cascade, so deleting an in-use type
    // would surface as a raw constraint failure instead of a clear 409.
    if (await this.roomTypesRepo.isInUse(id)) {
      throw new ConflictException(
        'Cannot delete a room type while rooms of that type exist',
      );
    }

    await this.roomTypesRepo.delete(id);
    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomTypeDeleted,
      subjectType: 'RoomType',
      subjectId: id,
      metadata: { name: roomType.name, hotelId: roomType.hotelId },
    });
  }
}
