import { Module } from '@nestjs/common';
import { FerryController } from './ferry.controller';
import { FerryRepository } from './ferry.repository';
import { FerryService } from './ferry.service';

@Module({
  controllers: [FerryController],
  providers: [FerryService, FerryRepository],
})
export class FerryModule {}
