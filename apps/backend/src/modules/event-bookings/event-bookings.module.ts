import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { EventSchedulesModule } from '../event-schedules/event-schedules.module';
import { EventsModule } from '../events/events.module';
import { ParkTicketsModule } from '../park-tickets/park-tickets.module';
import { EventBookingsController } from './event-bookings.controller';
import { EventBookingsRepository } from './event-bookings.repository';
import { EventBookingsService } from './event-bookings.service';

@Module({
  imports: [
    AuditModule,
    EventSchedulesModule, // seats + start time
    EventsModule, // base_price, for the snapshot
    ParkTicketsModule, // the prerequisite ticket
  ],
  controllers: [EventBookingsController],
  providers: [EventBookingsService, EventBookingsRepository],
  exports: [EventBookingsRepository],
})
export class EventBookingsModule {}
