import { Module } from '@nestjs/common';
import { ParkDaysModule } from '../park-days/park-days.module';
import { ParkDashboardController } from './park-dashboard.controller';
import { ParkDashboardRepository } from './park-dashboard.repository';
import { ParkDashboardService } from './park-dashboard.service';

@Module({
  // ParkDaysService owns the day-capacity rule the fill KPI and alerts read.
  imports: [ParkDaysModule],
  controllers: [ParkDashboardController],
  providers: [ParkDashboardService, ParkDashboardRepository],
})
export class ParkDashboardModule {}
