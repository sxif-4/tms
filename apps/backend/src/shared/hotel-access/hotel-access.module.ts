import { Module } from '@nestjs/common';
import { HotelAccessService } from './hotel-access.service';

@Module({
  providers: [HotelAccessService],
  exports: [HotelAccessService],
})
export class HotelAccessModule {}
