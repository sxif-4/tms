import {
  BadRequestException,
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
import { type PromotionUsage } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import {
  PROMOTION_TARGET_TYPES,
  type PromotionTargetType,
} from './dto/promotion-target.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';
import { type PromotionWithTargets } from './promotions.repository';

/**
 * Promotions management. Admins see and manage everything; hotel staff are
 * scoped to promotions targeting room types at their assigned hotels, and park
 * staff to event-targeted ones (see PromotionsService for the scoping rules).
 */
@Controller('promotions')
@Roles(Role.Admin, Role.HotelStaff, Role.ParkStaff)
export class PromotionsController {
  constructor(private readonly promoService: PromotionsService) {}

  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('targetType') targetType?: string,
  ): Promise<PromotionWithTargets[]> {
    return this.promoService.listAll(currentUser, parseTargetType(targetType));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    return this.promoService.findById(id, currentUser);
  }

  @Get(':id/usages')
  usages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PromotionUsage[]> {
    return this.promoService.listUsages(id, currentUser);
  }

  @Post()
  create(
    @Body() dto: CreatePromotionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    return this.promoService.create(dto, currentUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    return this.promoService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.promoService.remove(id, currentUser);
  }
}

function parseTargetType(value?: string): PromotionTargetType | undefined {
  if (!value) return undefined;
  if (!PROMOTION_TARGET_TYPES.includes(value as PromotionTargetType)) {
    throw new BadRequestException(
      `targetType must be one of: ${PROMOTION_TARGET_TYPES.join(', ')}`,
    );
  }
  return value as PromotionTargetType;
}
