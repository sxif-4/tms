import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { FerryModule } from '../ferry/ferry.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomTypesModule } from '../room-types/room-types.module';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
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
    UsersModule, // find-or-create the walk-in guest at the front desk
    FerryModule, // a confirmed stay comes with complimentary ferry passes
  ],
  controllers: [HotelBookingsController],
  providers: [HotelBookingsService, HotelBookingsRepository],
  exports: [HotelBookingsRepository],
})
export class HotelBookingsModule {}
