import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { ImagesModule } from '../../shared/images/images.module';
import { AmenitiesModule } from '../amenities/amenities.module';
import { RoomTypeImagesController } from './room-type-images.controller';
import { RoomTypeImagesService } from './room-type-images.service';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesRepository } from './room-types.repository';
import { RoomTypesService } from './room-types.service';

@Module({
  imports: [AuditModule, HotelAccessModule, AmenitiesModule, ImagesModule],
  controllers: [RoomTypesController, RoomTypeImagesController],
  providers: [RoomTypesService, RoomTypesRepository, RoomTypeImagesService],
  exports: [RoomTypesRepository],
})
export class RoomTypesModule {}
