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
import { RoomTypesRepository } from './room-types.repository';

/** Matches `imageables.imageable_type` for room-type galleries. */
const OWNER_TYPE = 'room_type';

@Injectable()
export class RoomTypeImagesService {
  constructor(
    private readonly imagesRepo: ImagesRepository,
    private readonly storage: ImageStorageService,
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  async list(
    user: AuthenticatedUser,
    roomTypeId: number,
  ): Promise<OwnedImage[]> {
    await this.assertAccess(user, roomTypeId);
    return this.imagesRepo.findForOwner(OWNER_TYPE, roomTypeId);
  }

  async upload(
    user: AuthenticatedUser,
    roomTypeId: number,
    file: Express.Multer.File,
  ): Promise<OwnedImage> {
    await this.assertAccess(user, roomTypeId);

    const url = this.storage.save(file);
    const image = await this.imagesRepo.attach(OWNER_TYPE, roomTypeId, url);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomTypeImageUploaded,
      subjectType: 'RoomType',
      subjectId: roomTypeId,
      metadata: { imageId: image.id, bytes: file.size },
    });
    return image;
  }

  async setCover(
    user: AuthenticatedUser,
    roomTypeId: number,
    imageId: number,
  ): Promise<OwnedImage[]> {
    await this.assertAccess(user, roomTypeId);
    await this.assertLink(roomTypeId, imageId);

    await this.imagesRepo.setCover(OWNER_TYPE, roomTypeId, imageId);
    return this.imagesRepo.findForOwner(OWNER_TYPE, roomTypeId);
  }

  async remove(
    user: AuthenticatedUser,
    roomTypeId: number,
    imageId: number,
  ): Promise<OwnedImage[]> {
    await this.assertAccess(user, roomTypeId);
    const link = await this.assertLink(roomTypeId, imageId);

    await this.imagesRepo.detach(OWNER_TYPE, roomTypeId, imageId);
    // Only after the row is gone, so a failed delete can't orphan the record.
    this.storage.remove(link.url);

    await this.audit.record({
      userId: user.id,
      action: AuditAction.RoomTypeImageDeleted,
      subjectType: 'RoomType',
      subjectId: roomTypeId,
      metadata: { imageId },
    });
    return this.imagesRepo.findForOwner(OWNER_TYPE, roomTypeId);
  }

  /** Room types are per-hotel, so photo access follows hotel assignment. */
  private async assertAccess(
    user: AuthenticatedUser,
    roomTypeId: number,
  ): Promise<void> {
    const roomType = await this.roomTypesRepo.findById(roomTypeId);
    if (!roomType) {
      throw new NotFoundException(`Room type #${roomTypeId} not found`);
    }
    await this.hotelAccess.assertHotelAccess(user, roomType.hotelId);
  }

  private async assertLink(
    roomTypeId: number,
    imageId: number,
  ): Promise<OwnedImage> {
    const link = await this.imagesRepo.findLink(
      OWNER_TYPE,
      roomTypeId,
      imageId,
    );
    if (!link) {
      throw new NotFoundException(
        `Image #${imageId} is not attached to room type #${roomTypeId}`,
      );
    }
    return link;
  }
}
