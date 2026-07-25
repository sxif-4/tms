import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import {
  RoomTypesRepository,
  type RoomTypeWithAmenities,
} from './room-types.repository';

/**
 * Room types are a global catalog (not owned by a single hotel), since the
 * same "Deluxe" concept is reused across properties. Creating one is open to
 * any hotel staff member; updating/deleting one is only blocked when doing so
 * would affect a hotel outside the actor's assignment.
 */
@Injectable()
export class RoomTypesService {
  constructor(
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  listAll(): Promise<RoomTypeWithAmenities[]> {
    return this.roomTypesRepo.findAll();
  }

  async findById(id: number): Promise<RoomTypeWithAmenities> {
    const roomType = await this.roomTypesRepo.findById(id);
    if (!roomType) throw new NotFoundException(`Room type #${id} not found`);
    return roomType;
  }

  async create(dto: CreateRoomTypeDto, actorId: number): Promise<RoomType> {
    const roomType = await this.roomTypesRepo.create({
      name: dto.name,
      description: dto.description,
      basePricePerNight: dto.basePricePerNight,
      maxOccupancy: dto.maxOccupancy,
    });
    await this.audit.record({
      userId: actorId,
      action: AuditAction.RoomTypeCreated,
      subjectType: 'RoomType',
      subjectId: roomType.id,
      metadata: { name: roomType.name },
    });
    return roomType;
  }

  async update(
    id: number,
    dto: UpdateRoomTypeDto,
    user: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities> {
    await this.findById(id); // 404 if missing
    await this.assertScopedAccess(user, id);

    const updated = await this.roomTypesRepo.update(id, dto);
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
    const roomType = await this.findById(id);
    await this.assertScopedAccess(user, id);

    await this.roomTypesRepo.delete(id);
    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomTypeDeleted,
      subjectType: 'RoomType',
      subjectId: id,
      metadata: { name: roomType.name },
    });
  }

  private async assertScopedAccess(
    user: AuthenticatedUser,
    roomTypeId: number,
  ): Promise<void> {
    if (user.role === Role.Admin) return;
    const hotelIdsUsing =
      await this.roomTypesRepo.hotelIdsUsingRoomType(roomTypeId);
    if (hotelIdsUsing.length === 0) return; // unused catalog entry — fair game

    const scope = await this.hotelAccess.scopedHotelIds(user);
    const scopedIds = scope === 'all' ? [] : scope;
    const outsideScope = hotelIdsUsing.some((id) => !scopedIds.includes(id));
    if (outsideScope) {
      throw new ForbiddenException(
        'This room type is used by a hotel outside your assignment',
      );
    }
  }
}
