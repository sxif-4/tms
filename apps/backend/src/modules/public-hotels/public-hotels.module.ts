import { Module } from '@nestjs/common';
import { PublicHotelsController } from './public-hotels.controller';
import { PublicHotelsRepository } from './public-hotels.repository';
import { PublicHotelsService } from './public-hotels.service';

@Module({
  controllers: [PublicHotelsController],
  providers: [PublicHotelsService, PublicHotelsRepository],
})
export class PublicHotelsModule {}
