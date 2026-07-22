import { Module } from '@nestjs/common';
import { ParkReportsController } from './park-reports.controller';
import { ParkReportsRepository } from './park-reports.repository';
import { ParkReportsService } from './park-reports.service';

@Module({
  controllers: [ParkReportsController],
  providers: [ParkReportsService, ParkReportsRepository],
})
export class ParkReportsModule {}
