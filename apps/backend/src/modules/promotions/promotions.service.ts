import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { HotelAccessService } from '../../shared/hotel-access/hotel-access.service';
import { type PromotionUsage } from '../../shared/database/schema';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { RoomTypesRepository } from '../room-types/room-types.repository';
import {
  CreatePromotionDto,
  type DiscountType,
} from './dto/create-promotion.dto';
import type { PromotionTargetDto } from './dto/promotion-target.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import {
  PromotionsRepository,
  type PromotionWithTargets,
} from './promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly promoRepo: PromotionsRepository,
    private readonly roomTypesRepo: RoomTypesRepository,
    private readonly hotelAccess: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Admins see every promotion. Hotel staff only see (and may only manage)
   * promotions scoped entirely to room types used by their assigned hotels —
   * platform-wide or other-domain promotions stay admin-only.
   */
  async listAll(user: AuthenticatedUser): Promise<PromotionWithTargets[]> {
    const all = await this.promoRepo.findAllWithTargets();
    if (user.role === Role.Admin) return all;

    const results: PromotionWithTargets[] = [];
    for (const promo of all) {
      if (await this.isWithinStaffScope(user, promo)) results.push(promo);
    }
    return results;
  }

  async findById(
    id: number,
    user?: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    const promo = await this.promoRepo.findByIdWithTargets(id);
    if (!promo) throw new NotFoundException(`Promotion #${id} not found`);
    if (user && user.role !== Role.Admin) {
      if (!(await this.isWithinStaffScope(user, promo))) {
        throw new ForbiddenException(
          'This promotion is outside your hotel assignment',
        );
      }
    }
    return promo;
  }

  async create(
    dto: CreatePromotionDto,
    actor: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    this.validateRules(
      dto.discountType,
      dto.discountValue,
      new Date(dto.validFrom),
      new Date(dto.validTo),
    );
    if (dto.code) await this.assertCodeFree(dto.code);
    if (actor.role !== Role.Admin) {
      await this.assertTargetsWithinStaffScope(actor, dto.targets);
    }

    const promo = await this.promoRepo.create({
      name: dto.name,
      description: dto.description,
      code: dto.code || null,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minSpend: dto.minSpend ?? null,
      usageLimit: dto.usageLimit ?? null,
      perUserLimit: dto.perUserLimit ?? null,
      validFrom: new Date(dto.validFrom),
      validTo: new Date(dto.validTo),
      isActive: dto.isActive ?? true,
    });

    if (dto.targets?.length) {
      await this.promoRepo.replaceTargets(promo.id, dto.targets);
    }

    await this.audit.record({
      userId: actor.id,
      action: AuditAction.PromotionCreated,
      subjectType: 'Promotion',
      subjectId: promo.id,
      metadata: { name: promo.name, code: promo.code },
    });
    return this.findById(promo.id);
  }

  async update(
    id: number,
    dto: UpdatePromotionDto,
    actor: AuthenticatedUser,
  ): Promise<PromotionWithTargets> {
    const current = await this.findById(id, actor); // 404/403 as appropriate

    const discountType = dto.discountType ?? current.discountType;
    const discountValue = dto.discountValue ?? current.discountValue;
    const validFrom = dto.validFrom
      ? new Date(dto.validFrom)
      : current.validFrom;
    const validTo = dto.validTo ? new Date(dto.validTo) : current.validTo;
    this.validateRules(discountType, discountValue, validFrom, validTo);

    if (dto.code && dto.code !== current.code) {
      await this.assertCodeFree(dto.code);
    }
    if (actor.role !== Role.Admin && dto.targets) {
      await this.assertTargetsWithinStaffScope(actor, dto.targets);
    }

    await this.promoRepo.update(id, {
      name: dto.name,
      description: dto.description,
      code: dto.code !== undefined ? dto.code || null : undefined,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minSpend: dto.minSpend,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
      validFrom: dto.validFrom ? validFrom : undefined,
      validTo: dto.validTo ? validTo : undefined,
      isActive: dto.isActive,
    });

    if (dto.targets) {
      await this.promoRepo.replaceTargets(id, dto.targets);
    }

    await this.audit.record({
      userId: actor.id,
      action: AuditAction.PromotionUpdated,
      subjectType: 'Promotion',
      subjectId: id,
    });
    return this.findById(id);
  }

  async remove(id: number, actor: AuthenticatedUser): Promise<void> {
    const promo = await this.findById(id, actor); // 404/403 as appropriate
    const usages = await this.promoRepo.countUsages(id);
    if (usages > 0) {
      throw new ConflictException(
        `Cannot delete a promotion with ${usages} recorded usage(s)`,
      );
    }
    await this.promoRepo.delete(id);
    await this.audit.record({
      userId: actor.id,
      action: AuditAction.PromotionDeleted,
      subjectType: 'Promotion',
      subjectId: id,
      metadata: { name: promo.name },
    });
  }

  async listUsages(id: number, user: AuthenticatedUser): Promise<PromotionUsage[]> {
    await this.findById(id, user); // 404/403 as appropriate
    return this.promoRepo.listUsages(id);
  }

  /** True if every room_type target belongs to a hotel the staff member manages, and there's at least one. */
  private async isWithinStaffScope(
    user: AuthenticatedUser,
    promo: PromotionWithTargets,
  ): Promise<boolean> {
    const roomTypeTargets = promo.targets.filter(
      (t) => t.targetType === 'room_type',
    );
    if (roomTypeTargets.length === 0) return false;

    const scope = await this.hotelAccess.scopedHotelIds(user);
    const scopedIds = scope === 'all' ? [] : scope;
    for (const target of roomTypeTargets) {
      const hotelIds = await this.roomTypesRepo.hotelIdsUsingRoomType(
        target.targetId,
      );
      if (
        hotelIds.length === 0 ||
        !hotelIds.every((id) => scopedIds.includes(id))
      ) {
        return false;
      }
    }
    return true;
  }

  private async assertTargetsWithinStaffScope(
    user: AuthenticatedUser,
    targets: PromotionTargetDto[] | undefined,
  ): Promise<void> {
    if (!targets?.length) {
      throw new ForbiddenException(
        'Hotel staff must scope promotions to at least one of their room types',
      );
    }
    const scope = await this.hotelAccess.scopedHotelIds(user);
    const scopedIds = scope === 'all' ? [] : scope;
    for (const target of targets) {
      if (target.targetType !== 'room_type') {
        throw new ForbiddenException(
          'Hotel staff may only scope promotions to room types',
        );
      }
      const hotelIds = await this.roomTypesRepo.hotelIdsUsingRoomType(
        target.targetId,
      );
      if (
        hotelIds.length === 0 ||
        !hotelIds.every((id) => scopedIds.includes(id))
      ) {
        throw new ForbiddenException(
          `Room type #${target.targetId} is not used by a hotel you manage`,
        );
      }
    }
  }

  private async assertCodeFree(code: string): Promise<void> {
    if (await this.promoRepo.findByCode(code)) {
      throw new ConflictException(`Promotion code "${code}" already exists`);
    }
  }

  private validateRules(
    discountType: DiscountType,
    discountValue: string,
    validFrom: Date,
    validTo: Date,
  ): void {
    if (validFrom >= validTo) {
      throw new BadRequestException('validFrom must be before validTo');
    }
    if (discountType === 'percentage' && Number(discountValue) > 100) {
      throw new BadRequestException('percentage discount cannot exceed 100');
    }
  }
}
