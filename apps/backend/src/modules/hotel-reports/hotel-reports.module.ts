import { Module } from '@nestjs/common';
import { HotelAccessModule } from '../../shared/hotel-access/hotel-access.module';
import { HotelReportsController } from './hotel-reports.controller';
import { HotelReportsRepository } from './hotel-reports.repository';
import { HotelReportsService } from './hotel-reports.service';

@Module({
  imports: [HotelAccessModule],
  controllers: [HotelReportsController],
  providers: [HotelReportsService, HotelReportsRepository],
})
export class HotelReportsModule {}
