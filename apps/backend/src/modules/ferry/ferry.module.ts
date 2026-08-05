import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { FerryController } from './ferry.controller';
import { FerryRepository } from './ferry.repository';
import { FerryService } from './ferry.service';

@Module({
  imports: [AuditModule],
  controllers: [FerryController],
  providers: [FerryService, FerryRepository],
})
export class FerryModule {}
