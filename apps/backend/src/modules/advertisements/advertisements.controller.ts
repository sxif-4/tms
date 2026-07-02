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
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Advertisement } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

/** Admin-only advertisement CMS. */
@Controller('advertisements')
@Roles(Role.Admin)
export class AdvertisementsController {
  constructor(private readonly adsService: AdvertisementsService) {}

  @Get()
  findAll(): Promise<Advertisement[]> {
    return this.adsService.listAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Advertisement> {
    return this.adsService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateAdvertisementDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Advertisement> {
    return this.adsService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdvertisementDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Advertisement> {
    return this.adsService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.adsService.remove(id, currentUser.id);
  }
}
