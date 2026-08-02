import { Controller, Get } from '@nestjs/common';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Facility } from '../../shared/database/schema';
import { FacilitiesRepository } from './facilities.repository';

/**
 * Read-only facility catalog. Public because the visitor-facing hotel pages
 * render facility names and icons alongside the hotel's own list.
 */
@Controller('facilities')
@Public()
@Roles()
export class FacilitiesController {
  constructor(private readonly facilitiesRepo: FacilitiesRepository) {}

  @Get()
  findAll(): Promise<Facility[]> {
    return this.facilitiesRepo.findAll();
  }
}
