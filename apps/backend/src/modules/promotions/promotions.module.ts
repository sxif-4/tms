import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { EventsModule } from '../events/events.module';
import { RoomTypesModule } from '../room-types/room-types.module';
import { PromotionsController } from './promotions.controller';
import { PromotionsRepository } from './promotions.repository';
import { PromotionsService } from './promotions.service';

@Module({
  // EventsModule: park staff scope promotions to events, which must exist.
  imports: [AuditModule, HotelAccessModule, RoomTypesModule, EventsModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsRepository],
})
export class PromotionsModule {}
