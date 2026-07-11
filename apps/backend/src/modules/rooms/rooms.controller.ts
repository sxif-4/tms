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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Room } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

/** Rooms are always scoped to a hotel — every route is hotel-access-guarded. */
@Controller('rooms')
@Roles(Role.Admin, Role.HotelStaff)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(
    @Query('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Room[]> {
    return this.roomsService.listByHotel(currentUser, hotelId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Room> {
    return this.roomsService.findById(currentUser, id);
  }

  @Post()
  create(
    @Body() dto: CreateRoomDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Room> {
    return this.roomsService.create(dto, currentUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Room> {
    return this.roomsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.roomsService.remove(id, currentUser);
  }
}
