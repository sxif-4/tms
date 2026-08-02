import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Amenity } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import { AmenitiesRepository } from './amenities.repository';

/**
 * Read-only amenity catalog, used to populate the room-type amenity picker.
 * The catalog itself is fixed taxonomy seeded with the database; staff choose
 * from it rather than inventing entries per hotel.
 */
@Controller('amenities')
@Roles(Role.Admin, Role.HotelStaff)
export class AmenitiesController {
  constructor(private readonly amenitiesRepo: AmenitiesRepository) {}

  @Get()
  findAll(): Promise<Amenity[]> {
    return this.amenitiesRepo.findAll();
  }
}
