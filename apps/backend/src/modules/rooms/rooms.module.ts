import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomTypesModule } from '../room-types/room-types.module';
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';

@Module({
  // RoomTypesModule exports its repository so a room can be checked against
  // its hotel's own room types. HotelsModule exports its repository so room
  // creation can be checked against the hotel's max_rooms.
  imports: [AuditModule, HotelAccessModule, RoomTypesModule, HotelsModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsRepository],
})
export class RoomsModule {}
