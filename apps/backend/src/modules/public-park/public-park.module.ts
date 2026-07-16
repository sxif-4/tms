import { Module } from '@nestjs/common';
import { ParkDaysModule } from '../park-days/park-days.module';
import { PublicParkController } from './public-park.controller';
import { PublicParkRepository } from './public-park.repository';
import { PublicParkService } from './public-park.service';

@Module({
  // The public date picker reads the same capacity rule staff manage.
  imports: [ParkDaysModule],
  controllers: [PublicParkController],
  providers: [PublicParkService, PublicParkRepository],
})
export class PublicParkModule {}
