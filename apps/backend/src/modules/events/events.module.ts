import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';

@Module({
  imports: [AuditModule],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsRepository],
})
export class EventsModule {}
