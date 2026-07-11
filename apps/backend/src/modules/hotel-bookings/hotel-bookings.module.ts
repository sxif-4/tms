import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomTypesModule } from '../room-types/room-types.module';
import { RoomsModule } from '../rooms/rooms.module';
import { HotelBookingsController } from './hotel-bookings.controller';
import { HotelBookingsRepository } from './hotel-bookings.repository';
import { HotelBookingsService } from './hotel-bookings.service';

@Module({
  imports: [
    AuditModule,
    HotelAccessModule,
    HotelsModule,
    RoomTypesModule,
    RoomsModule,
  ],
  controllers: [HotelBookingsController],
  providers: [HotelBookingsService, HotelBookingsRepository],
  exports: [HotelBookingsRepository],
})
export class HotelBookingsModule {}
