import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { type ParkTicketType } from '../../shared/database/schema';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateParkTicketTypeDto } from './dto/create-park-ticket-type.dto';
import { UpdateParkTicketTypeDto } from './dto/update-park-ticket-type.dto';
import { ParkTicketTypesService } from './park-ticket-types.service';

/** Park-wide ticket catalog — every park staff member manages all of it. */
@Controller('park-ticket-types')
@Roles(Role.Admin, Role.ParkStaff)
export class ParkTicketTypesController {
  constructor(private readonly ticketTypesService: ParkTicketTypesService) {}

  @Get()
  findAll(): Promise<ParkTicketType[]> {
    return this.ticketTypesService.listAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ParkTicketType> {
    return this.ticketTypesService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateParkTicketTypeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketType> {
    return this.ticketTypesService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParkTicketTypeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ParkTicketType> {
    return this.ticketTypesService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.ticketTypesService.remove(id, currentUser.id);
  }
}
