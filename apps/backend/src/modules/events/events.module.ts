import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { ImagesModule } from '../../shared/images/images.module';
import { EventImagesController } from './event-images.controller';
import { EventImagesService } from './event-images.service';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';

@Module({
  imports: [AuditModule, ImagesModule],
  controllers: [EventsController, EventImagesController],
  providers: [EventsService, EventsRepository, EventImagesService],
  exports: [EventsRepository],
})
export class EventsModule {}
