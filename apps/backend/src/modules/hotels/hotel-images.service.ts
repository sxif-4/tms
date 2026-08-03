import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import { ImageStorageService } from '../../shared/images/image-storage.service';
import {
  ImagesRepository,
  type OwnedImage,
} from '../../shared/images/images.repository';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { HotelsRepository } from './hotels.repository';

/** Matches `imageables.imageable_type` for hotel photo galleries. */
const OWNER_TYPE = 'hotel';

@Injectable()
export class HotelImagesService {
  constructor(
    private readonly imagesRepo: ImagesRepository,
    private readonly storage: ImageStorageService,
    private readonly hotelsRepo: HotelsRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, hotelId: number): Promise<OwnedImage[]> {
    await this.assertAccess(user, hotelId);
    return this.imagesRepo.findForOwner(OWNER_TYPE, hotelId);
  }

  async upload(
    user: AuthenticatedUser,
    hotelId: number,
    file: Express.Multer.File,
  ): Promise<OwnedImage> {
    await this.assertAccess(user, hotelId);

    const url = this.storage.save(file);
    const image = await this.imagesRepo.attach(OWNER_TYPE, hotelId, url);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.HotelImageUploaded,
      subjectType: 'Hotel',
      subjectId: hotelId,
      metadata: { imageId: image.id, bytes: file.size },
    });
    return image;
  }

  async setCover(
    user: AuthenticatedUser,
    hotelId: number,
    imageId: number,
  ): Promise<OwnedImage[]> {
    await this.assertAccess(user, hotelId);
    await this.assertLink(hotelId, imageId);

    await this.imagesRepo.setCover(OWNER_TYPE, hotelId, imageId);
    return this.imagesRepo.findForOwner(OWNER_TYPE, hotelId);
  }

  async remove(
    user: AuthenticatedUser,
    hotelId: number,
    imageId: number,
  ): Promise<OwnedImage[]> {
    await this.assertAccess(user, hotelId);
    const link = await this.assertLink(hotelId, imageId);

    await this.imagesRepo.detach(OWNER_TYPE, hotelId, imageId);
    // Only after the row is gone, so a failed delete can't orphan the record.
    this.storage.remove(link.url);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.HotelImageDeleted,
      subjectType: 'Hotel',
      subjectId: hotelId,
      metadata: { imageId },
    });
    return this.imagesRepo.findForOwner(OWNER_TYPE, hotelId);
  }

  private async assertAccess(
    user: AuthenticatedUser,
    hotelId: number,
  ): Promise<void> {
    const hotel = await this.hotelsRepo.findById(hotelId);
    if (!hotel) throw new NotFoundException(`Hotel #${hotelId} not found`);
    await this.hotelAccess.assertHotelAccess(user, hotelId);
  }

  private async assertLink(
    hotelId: number,
    imageId: number,
  ): Promise<OwnedImage> {
    const link = await this.imagesRepo.findLink(OWNER_TYPE, hotelId, imageId);
    if (!link) {
      throw new NotFoundException(
        `Image #${imageId} is not attached to hotel #${hotelId}`,
      );
    }
    return link;
  }
}
