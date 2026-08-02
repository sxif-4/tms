import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { type Hotel } from '../../shared/database/schema';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { MapLocationsRepository } from '../map-locations/map-locations.repository';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelsRepository } from './hotels.repository';

@Injectable()
export class HotelsService {
  constructor(
    private readonly hotelsRepo: HotelsRepository,
    private readonly locationsRepo: MapLocationsRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Hotels the user manages — every hotel for admins, assigned-only for staff.
   * Suspended hotels stay in the list for both: admins need them to reactivate,
   * staff need them to see out the guests already booked in.
   */
  async listForUser(user: AuthenticatedUser): Promise<Hotel[]> {
    const scope = await this.hotelAccess.scopedHotelIds(user);
    return scope === 'all'
      ? this.hotelsRepo.findAll()
      : this.hotelsRepo.findByIds(scope);
  }

  async getById(user: AuthenticatedUser, id: number): Promise<Hotel> {
    await this.hotelAccess.assertHotelAccess(user, id);
    const hotel = await this.hotelsRepo.findById(id);
    if (!hotel) throw new NotFoundException(`Hotel #${id} not found`);
    return hotel;
  }

  async create(dto: CreateHotelDto, actorId: number): Promise<Hotel> {
    if (await this.hotelsRepo.nameExists(dto.name)) {
      throw new ConflictException(`A hotel named "${dto.name}" already exists`);
    }
    await this.assertLocationExists(dto.mapLocationId);

    const hotel = await this.hotelsRepo.create({
      name: dto.name,
      description: dto.description,
      mapLocationId: dto.mapLocationId,
      maxRooms: dto.maxRooms,
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.HotelCreated,
      subjectType: 'Hotel',
      subjectId: hotel.id,
      metadata: { name: hotel.name, maxRooms: hotel.maxRooms },
    });
    return hotel;
  }

  async update(
    id: number,
    dto: UpdateHotelDto,
    actorId: number,
  ): Promise<Hotel> {
    const existing = await this.hotelsRepo.findById(id);
    if (!existing) throw new NotFoundException(`Hotel #${id} not found`);

    if (dto.name && dto.name !== existing.name) {
      if (await this.hotelsRepo.nameExists(dto.name)) {
        throw new ConflictException(
          `A hotel named "${dto.name}" already exists`,
        );
      }
    }
    await this.assertLocationExists(dto.mapLocationId);

    const updated = await this.hotelsRepo.update(id, {
      name: dto.name,
      description: dto.description,
      mapLocationId: dto.mapLocationId,
      maxRooms: dto.maxRooms,
    });
    if (!updated) throw new NotFoundException(`Hotel #${id} not found`);

    await this.audit.record({
      userId: actorId,
      action: AuditAction.HotelUpdated,
      subjectType: 'Hotel',
      subjectId: id,
      metadata: { name: updated.name },
    });
    return updated;
  }

  activate(id: number, actorId: number): Promise<Hotel> {
    return this.setActive(id, true, actorId, AuditAction.HotelActivated);
  }

  deactivate(id: number, actorId: number): Promise<Hotel> {
    return this.setActive(id, false, actorId, AuditAction.HotelDeactivated);
  }

  private async setActive(
    id: number,
    isActive: boolean,
    actorId: number,
    action: AuditAction,
  ): Promise<Hotel> {
    const existing = await this.hotelsRepo.findById(id);
    if (!existing) throw new NotFoundException(`Hotel #${id} not found`);

    await this.hotelsRepo.setActive(id, isActive);
    await this.audit.record({
      userId: actorId,
      action,
      subjectType: 'Hotel',
      subjectId: id,
      metadata: { name: existing.name },
    });

    const hotel = await this.hotelsRepo.findById(id);
    if (!hotel) throw new NotFoundException(`Hotel #${id} not found`);
    return hotel;
  }

  /** Foreign keys are enforced, so an unknown id would surface as a raw 500. */
  private async assertLocationExists(mapLocationId?: number): Promise<void> {
    if (mapLocationId == null) return;
    const location = await this.locationsRepo.findById(mapLocationId);
    if (!location) {
      throw new NotFoundException(`Map location #${mapLocationId} not found`);
    }
  }
}
