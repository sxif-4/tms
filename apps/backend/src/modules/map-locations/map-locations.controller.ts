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
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type MapLocation } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreateMapLocationDto } from './dto/create-map-location.dto';
import { UpdateMapLocationDto } from './dto/update-map-location.dto';
import { MapLocationsService } from './map-locations.service';

/**
 * Reads are public — the island map is shown to signed-out visitors too.
 * Writes stay admin-only.
 */
@Controller('map-locations')
@Roles(Role.Admin)
export class MapLocationsController {
  constructor(private readonly locationsService: MapLocationsService) {}

  @Get()
  @Public()
  @Roles()
  findAll(): Promise<MapLocation[]> {
    return this.locationsService.listAll();
  }

  @Get(':id')
  @Public()
  @Roles()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MapLocation> {
    return this.locationsService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateMapLocationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<MapLocation> {
    return this.locationsService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMapLocationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<MapLocation> {
    return this.locationsService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.locationsService.remove(id, currentUser.id);
  }
}
