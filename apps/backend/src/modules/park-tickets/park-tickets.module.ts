import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { ParkDaysModule } from '../park-days/park-days.module';
import { ParkTicketTypesModule } from '../park-ticket-types/park-ticket-types.module';
import { UsersModule } from '../users/users.module';
import { ParkTicketsController } from './park-tickets.controller';
import { ParkTicketsRepository } from './park-tickets.repository';
import { ParkTicketsService } from './park-tickets.service';

@Module({
  imports: [
    AuditModule,
    ParkTicketTypesModule, // priced catalog, for the price snapshot
    ParkDaysModule, // owns the day-capacity rule sales must obey
    UsersModule, // find-or-create the walk-up customer at the gate
  ],
  controllers: [ParkTicketsController],
  providers: [ParkTicketsService, ParkTicketsRepository],
  exports: [ParkTicketsRepository],
})
export class ParkTicketsModule {}
