import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { ImagesModule } from '../../shared/images/images.module';
import { AdvertisementsController } from './advertisements.controller';
import { AdvertisementsRepository } from './advertisements.repository';
import { AdvertisementsService } from './advertisements.service';

@Module({
  // ImagesModule for ImageStorageService only — ads keep a denormalized
  // `image` URL rather than rows in images/imageables.
  imports: [AuditModule, ImagesModule],
  controllers: [AdvertisementsController],
  providers: [AdvertisementsService, AdvertisementsRepository],
})
export class AdvertisementsModule {}
