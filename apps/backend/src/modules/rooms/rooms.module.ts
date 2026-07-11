import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { RoomsController } from './rooms.controller';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';

@Module({
  imports: [AuditModule, HotelAccessModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository],
  exports: [RoomsRepository],
})
export class RoomsModule {}
