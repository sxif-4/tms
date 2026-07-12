import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { ParkTicketTypesController } from './park-ticket-types.controller';
import { ParkTicketTypesRepository } from './park-ticket-types.repository';
import { ParkTicketTypesService } from './park-ticket-types.service';

@Module({
  imports: [AuditModule],
  controllers: [ParkTicketTypesController],
  providers: [ParkTicketTypesService, ParkTicketTypesRepository],
  exports: [ParkTicketTypesRepository],
})
export class ParkTicketTypesModule {}
