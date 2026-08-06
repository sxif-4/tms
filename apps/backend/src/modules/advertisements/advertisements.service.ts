import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { type Advertisement } from '../../shared/database/schema';
import { ImageStorageService } from '../../shared/images/image-storage.service';
import { AdvertisementsRepository } from './advertisements.repository';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(
    private readonly adsRepo: AdvertisementsRepository,
    private readonly audit: AuditService,
    private readonly storage: ImageStorageService,
  ) {}

  /**
   * Stores a creative and hands back its public URL for the caller to submit
   * as `image`. Standalone rather than `:id/image` because `image` is NOT NULL
   * — the artwork has to exist before the ad row does.
   */
  async uploadImage(
    file: Express.Multer.File,
    actorId: number,
  ): Promise<{ url: string }> {
    const url = this.storage.save(file);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.AdvertisementImageUploaded,
      subjectType: 'Advertisement',
      // No ad yet on the create path; the URL is what identifies the upload.
      subjectId: 0,
      metadata: { url, bytes: file.size },
    });
    return { url };
  }

  listAll(): Promise<Advertisement[]> {
    return this.adsRepo.findAll();
  }

  listActive(placement?: string): Promise<Advertisement[]> {
    return this.adsRepo.findActive(placement);
  }

  async findById(id: number): Promise<Advertisement> {
    const ad = await this.adsRepo.findById(id);
    if (!ad) throw new NotFoundException(`Advertisement #${id} not found`);
    return ad;
  }

  async create(
    dto: CreateAdvertisementDto,
    actorId: number,
  ): Promise<Advertisement> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (startsAt > endsAt) {
      throw new BadRequestException('startsAt must be on or before endsAt');
    }

    const ad = await this.adsRepo.create({
      title: dto.title,
      image: dto.image,
      targetUrl: dto.targetUrl,
      placement: dto.placement,
      startsAt,
      endsAt,
      isActive: dto.isActive ?? true,
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.AdvertisementCreated,
      subjectType: 'Advertisement',
      subjectId: ad.id,
      metadata: { title: ad.title, placement: ad.placement },
    });
    return ad;
  }

  async update(
    id: number,
    dto: UpdateAdvertisementDto,
    actorId: number,
  ): Promise<Advertisement> {
    const current = await this.findById(id);

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
    if (startsAt > endsAt) {
      throw new BadRequestException('startsAt must be on or before endsAt');
    }

    const updated = await this.adsRepo.update(id, {
      title: dto.title,
      image: dto.image,
      targetUrl: dto.targetUrl,
      placement: dto.placement,
      startsAt: dto.startsAt ? startsAt : undefined,
      endsAt: dto.endsAt ? endsAt : undefined,
      isActive: dto.isActive,
    });
    if (!updated) throw new NotFoundException(`Advertisement #${id} not found`);

    // Swapping the creative orphans the old file. `remove` ignores anything
    // that isn't one of ours, so seeded remote URLs pass through untouched.
    if (dto.image && dto.image !== current.image) {
      this.storage.remove(current.image);
    }

    await this.audit.record({
      userId: actorId,
      action: AuditAction.AdvertisementUpdated,
      subjectType: 'Advertisement',
      subjectId: id,
    });
    return updated;
  }

  async remove(id: number, actorId: number): Promise<void> {
    const ad = await this.findById(id);
    await this.adsRepo.delete(id);
    this.storage.remove(ad.image);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.AdvertisementDeleted,
      subjectType: 'Advertisement',
      subjectId: id,
      metadata: { title: ad.title },
    });
  }
}
