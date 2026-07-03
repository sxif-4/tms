import { Module } from '@nestjs/common';
import { AuditModule } from '../../shared/audit/audit.module';
import { MapLocationsController } from './map-locations.controller';
import { MapLocationsRepository } from './map-locations.repository';
import { MapLocationsService } from './map-locations.service';

@Module({
  imports: [AuditModule],
  controllers: [MapLocationsController],
  providers: [MapLocationsService, MapLocationsRepository],
})
export class MapLocationsModule {}
