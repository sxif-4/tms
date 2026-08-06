import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { CustomerSearchRow } from './customers.repository';
import { CustomersService, type CustomerProfile } from './customers.service';

/**
 * Admin-only cross-domain view of a customer. Read-only: the cancel and amend
 * actions the admin UI offers post to the owning domain's own endpoints.
 */
@Controller('customers')
@Roles(Role.Admin)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /** Search by name, email, or an exact booking/ticket reference. */
  @Get()
  search(@Query('q') q?: string): Promise<CustomerSearchRow[]> {
    return this.customersService.search(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomerProfile> {
    return this.customersService.findById(id);
  }
}
