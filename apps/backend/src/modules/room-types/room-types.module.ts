import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesRepository } from './room-types.repository';
import { RoomTypesService } from './room-types.service';

@Module({
  imports: [AuditModule, HotelAccessModule],
  controllers: [RoomTypesController],
  providers: [RoomTypesService, RoomTypesRepository],
  exports: [RoomTypesRepository],
})
export class RoomTypesModule {}
