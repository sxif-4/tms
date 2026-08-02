import { Module } from '@nestjs/common';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesRepository } from './facilities.repository';

@Module({
  controllers: [FacilitiesController],
  providers: [FacilitiesRepository],
  exports: [FacilitiesRepository],
})
export class FacilitiesModule {}
