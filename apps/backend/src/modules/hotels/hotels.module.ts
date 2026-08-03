import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { ImagesModule } from '../../shared/images/images.module';
import { FacilitiesModule } from '../facilities/facilities.module';
import { MapLocationsModule } from '../map-locations/map-locations.module';
import { HotelImagesController } from './hotel-images.controller';
import { HotelImagesService } from './hotel-images.service';
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
    ImagesModule,
  ],
  controllers: [HotelsController, HotelImagesController],
  providers: [HotelsService, HotelsRepository, HotelImagesService],
  exports: [HotelsRepository],
})
export class HotelsModule {}
