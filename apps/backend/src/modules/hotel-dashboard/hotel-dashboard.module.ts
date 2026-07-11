import { Module } from '@nestjs/common';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { HotelDashboardController } from './hotel-dashboard.controller';
import { HotelDashboardRepository } from './hotel-dashboard.repository';
import { HotelDashboardService } from './hotel-dashboard.service';

@Module({
  imports: [HotelAccessModule],
  controllers: [HotelDashboardController],
  providers: [HotelDashboardService, HotelDashboardRepository],
})
export class HotelDashboardModule {}
