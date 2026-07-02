import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { AdvertisementsController } from './advertisements.controller';
import { AdvertisementsRepository } from './advertisements.repository';
import { AdvertisementsService } from './advertisements.service';

@Module({
  imports: [AuditModule],
  controllers: [AdvertisementsController],
  providers: [AdvertisementsService, AdvertisementsRepository],
})
export class AdvertisementsModule {}
