import { Module } from '@nestjs/common';
import { FerryDashboardController } from './ferry-dashboard.controller';
import { FerryDashboardRepository } from './ferry-dashboard.repository';
import { FerryDashboardService } from './ferry-dashboard.service';

@Module({
  controllers: [FerryDashboardController],
  providers: [FerryDashboardService, FerryDashboardRepository],
})
export class FerryDashboardModule {}
