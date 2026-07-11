import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { type MapLocation } from '../../shared/database/schema';
import { CreateMapLocationDto } from './dto/create-map-location.dto';
import { UpdateMapLocationDto } from './dto/update-map-location.dto';
import { MapLocationsRepository } from './map-locations.repository';

/** decimal(5,2) is stored as text — keep exact percentage positions. */
const coord = (n: number) => n.toFixed(2);

@Injectable()
export class MapLocationsService {
  constructor(
    private readonly locationsRepo: MapLocationsRepository,
    private readonly audit: AuditService,
  ) {}

  listAll(): Promise<MapLocation[]> {
    return this.locationsRepo.findAll();
  }

  async findById(id: number): Promise<MapLocation> {
    const location = await this.locationsRepo.findById(id);
    if (!location) throw new NotFoundException(`Location #${id} not found`);
    return location;
  }

  async create(
    dto: CreateMapLocationDto,
    actorId: number,
  ): Promise<MapLocation> {
    const location = await this.locationsRepo.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      positionTop: coord(dto.positionTop),
      positionLeft: coord(dto.positionLeft),
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.LocationCreated,
      subjectType: 'MapLocation',
      subjectId: location.id,
      metadata: { name: location.name, type: location.type },
    });
    return location;
  }

  async update(
    id: number,
    dto: UpdateMapLocationDto,
    actorId: number,
  ): Promise<MapLocation> {
    await this.findById(id); // 404 if missing

    const updated = await this.locationsRepo.update(id, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      positionTop: dto.positionTop != null ? coord(dto.positionTop) : undefined,
      positionLeft:
        dto.positionLeft != null ? coord(dto.positionLeft) : undefined,
    });
    if (!updated) throw new NotFoundException(`Location #${id} not found`);

    await this.audit.record({
      userId: actorId,
      action: AuditAction.LocationUpdated,
      subjectType: 'MapLocation',
      subjectId: id,
    });
    return updated;
  }

  async remove(id: number, actorId: number): Promise<void> {
    const location = await this.findById(id);
    await this.locationsRepo.delete(id);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.LocationDeleted,
      subjectType: 'MapLocation',
      subjectId: id,
      metadata: { name: location.name },
    });
  }
}
