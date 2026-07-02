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
import { type PromotionUsage } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';
import { type PromotionWithTargets } from './promotions.repository';

/** Admin-only promotions management. */
@Controller('promotions')
@Roles(Role.Admin)
export class PromotionsController {
  constructor(private readonly promoService: PromotionsService) {}

  @Get()
  findAll(): Promise<PromotionWithTargets[]> {
    return this.promoService.listAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromotionWithTargets> {
    return this.promoService.findById(id);
  }

  @Get(':id/usages')
  usages(@Param('id', ParseIntPipe) id: number): Promise<PromotionUsage[]> {
    return this.promoService.listUsages(id);
  }

  @Post()
  create(
    @Body() dto: CreatePromotionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    return this.promoService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    return this.promoService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.promoService.remove(id, currentUser.id);
  }
}
