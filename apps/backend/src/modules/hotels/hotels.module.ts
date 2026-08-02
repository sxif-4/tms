import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { FacilitiesModule } from '../facilities/facilities.module';
import { MapLocationsModule } from '../map-locations/map-locations.module';
import { HotelsController } from './hotels.controller';
import { HotelsRepository } from './hotels.repository';
import { HotelsService } from './hotels.service';

@Module({
  // MapLocationsModule exports its repository so hotel writes can validate the
  // optional map_location_id before the FK constraint turns it into a 500.
  imports: [
    HotelAccessModule,
    AuditModule,
    MapLocationsModule,
    FacilitiesModule,
  ],
  controllers: [HotelsController],
  providers: [HotelsService, HotelsRepository],
  exports: [HotelsRepository],
})
export class HotelsModule {}
