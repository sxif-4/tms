import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { ImageStorageService } from '../../shared/images/image-storage.service';
import {
  ImagesRepository,
  type OwnedImage,
} from '../../shared/images/images.repository';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { EventsRepository } from './events.repository';

/** Matches `imageables.imageable_type` for event photo galleries. */
const OWNER_TYPE = 'event';

/**
 * Photos for a ride, show or beach event. Mirrors `HotelImagesService` minus
 * the per-entity scoping: events are park-wide, so existence is the only
 * check — the controller's `@Roles` already limits this to park staff.
 */
@Injectable()
export class EventImagesService {
  constructor(
    private readonly imagesRepo: ImagesRepository,
    private readonly storage: ImageStorageService,
    private readonly eventsRepo: EventsRepository,
    private readonly audit: AuditService,
  ) {}

  async list(eventId: number): Promise<OwnedImage[]> {
    await this.assertEvent(eventId);
    return this.imagesRepo.findForOwner(OWNER_TYPE, eventId);
  }

  async upload(
    user: AuthenticatedUser,
    eventId: number,
    file: Express.Multer.File,
  ): Promise<OwnedImage> {
    await this.assertEvent(eventId);

    const url = this.storage.save(file);
    const image = await this.imagesRepo.attach(OWNER_TYPE, eventId, url);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.EventImageUploaded,
      subjectType: 'Event',
      subjectId: eventId,
      metadata: { imageId: image.id, bytes: file.size },
    });
    return image;
  }

  async setCover(eventId: number, imageId: number): Promise<OwnedImage[]> {
    await this.assertEvent(eventId);
    await this.assertLink(eventId, imageId);

    await this.imagesRepo.setCover(OWNER_TYPE, eventId, imageId);
    return this.imagesRepo.findForOwner(OWNER_TYPE, eventId);
  }

  async remove(
    user: AuthenticatedUser,
    eventId: number,
    imageId: number,
  ): Promise<OwnedImage[]> {
    await this.assertEvent(eventId);
    const link = await this.assertLink(eventId, imageId);

    await this.imagesRepo.detach(OWNER_TYPE, eventId, imageId);
    // Only after the row is gone, so a failed delete can't orphan the record.
    this.storage.remove(link.url);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.EventImageDeleted,
      subjectType: 'Event',
      subjectId: eventId,
      metadata: { imageId },
    });
    return this.imagesRepo.findForOwner(OWNER_TYPE, eventId);
  }

  private async assertEvent(eventId: number): Promise<void> {
    const event = await this.eventsRepo.findById(eventId);
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);
  }

  private async assertLink(
    eventId: number,
    imageId: number,
  ): Promise<OwnedImage> {
    const link = await this.imagesRepo.findLink(OWNER_TYPE, eventId, imageId);
    if (!link) {
      throw new NotFoundException(
        `Image #${imageId} is not attached to event #${eventId}`,
      );
    }
    return link;
  }
}
