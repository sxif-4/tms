import { Module } from '@nestjs/common';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesRepository } from './amenities.repository';

@Module({
  controllers: [AmenitiesController],
  providers: [AmenitiesRepository],
  exports: [AmenitiesRepository],
})
export class AmenitiesModule {}
