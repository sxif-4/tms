import { Module } from '@nestjs/common';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { HotelsController } from './hotels.controller';
import { HotelsRepository } from './hotels.repository';
import { HotelsService } from './hotels.service';

@Module({
  imports: [HotelAccessModule],
  controllers: [HotelsController],
  providers: [HotelsService, HotelsRepository],
  exports: [HotelsRepository],
})
export class HotelsModule {}
