import { Module } from '@nestjs/common';
import { FerryReportsController } from './ferry-reports.controller';
import { FerryReportsRepository } from './ferry-reports.repository';
import { FerryReportsService } from './ferry-reports.service';

@Module({
  controllers: [FerryReportsController],
  providers: [FerryReportsService, FerryReportsRepository],
})
export class FerryReportsModule {}
