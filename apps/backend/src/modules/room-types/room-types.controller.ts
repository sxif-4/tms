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
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import type { RoomTypeWithAmenities } from './room-types.repository';
import { RoomTypesService } from './room-types.service';

/** A hotel's own room types. Every route is scoped to the caller's assignments. */
@Controller('room-types')
@Roles(Role.Admin, Role.HotelStaff)
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  findAll(
    @Query('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities[]> {
    return this.roomTypesService.listByHotel(currentUser, hotelId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities> {
    return this.roomTypesService.findById(currentUser, id);
  }

  @Post()
  create(
    @Body() dto: CreateRoomTypeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities> {
    return this.roomTypesService.create(dto, currentUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomTypeDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<RoomTypeWithAmenities> {
    return this.roomTypesService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.roomTypesService.remove(id, currentUser);
  }
}
