import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { ParkDaysController } from './park-days.controller';
import { ParkDaysRepository } from './park-days.repository';
import { ParkDaysService } from './park-days.service';

@Module({
  imports: [AuditModule],
  controllers: [ParkDaysController],
  providers: [ParkDaysService, ParkDaysRepository],
  // ParkDaysService owns the capacity rule (default vs override vs closed);
  // park-tickets will gate sales on it rather than re-deriving it.
  exports: [ParkDaysService, ParkDaysRepository],
})
export class ParkDaysModule {}
