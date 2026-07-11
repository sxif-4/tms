import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { RoomTypesModule } from '../room-types/room-types.module';
import { PromotionsController } from './promotions.controller';
import { PromotionsRepository } from './promotions.repository';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [AuditModule, HotelAccessModule, RoomTypesModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionsRepository],
})
export class PromotionsModule {}
