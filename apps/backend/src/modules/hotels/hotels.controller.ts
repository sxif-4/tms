import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Hotel } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { HotelsService } from './hotels.service';

/**
 * Reads are scoped to the caller's assignments (admins see every hotel);
 * writes are admin-only — hotel staff manage rooms and bookings within a
 * hotel, not the hotel record itself.
 *
 * Hotels are suspended rather than deleted: bookings, payments and reports all
 * reference them, and a price snapshot is meaningless without its hotel.
 */
@Controller('hotels')
@Roles(Role.Admin, Role.HotelStaff)
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<Hotel[]> {
    return this.hotelsService.listForUser(currentUser);
  }

  @Post()
  @Roles(Role.Admin)
  create(
    @Body() dto: CreateHotelDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Hotel> {
    return this.hotelsService.create(dto, currentUser.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Hotel> {
    return this.hotelsService.getById(currentUser, id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHotelDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Hotel> {
    return this.hotelsService.update(id, dto, currentUser.id);
  }

  @Patch(':id/activate')
  @Roles(Role.Admin)
  activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Hotel> {
    return this.hotelsService.activate(id, currentUser.id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.Admin)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Hotel> {
    return this.hotelsService.deactivate(id, currentUser.id);
  }
}
