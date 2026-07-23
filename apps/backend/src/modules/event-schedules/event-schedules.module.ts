import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { EventsModule } from '../events/events.module';
import { EventSchedulesController } from './event-schedules.controller';
import { EventSchedulesRepository } from './event-schedules.repository';
import { EventSchedulesService } from './event-schedules.service';

@Module({
  // EventsModule exports EventsRepository — schedules must prove their parent exists.
  imports: [AuditModule, EventsModule],
  controllers: [EventSchedulesController],
  providers: [EventSchedulesService, EventSchedulesRepository],
  exports: [EventSchedulesRepository],
})
export class EventSchedulesModule {}
