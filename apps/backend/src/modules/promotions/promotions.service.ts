import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { type PromotionUsage } from '../../shared/database/schema';
import {
  CreatePromotionDto,
  type DiscountType,
} from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import {
  PromotionsRepository,
  type PromotionWithTargets,
} from './promotions.repository';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly promoRepo: PromotionsRepository,
    private readonly audit: AuditService,
  ) {}

  listAll(): Promise<PromotionWithTargets[]> {
    return this.promoRepo.findAllWithTargets();
  }

  async findById(id: number): Promise<PromotionWithTargets> {
    const promo = await this.promoRepo.findByIdWithTargets(id);
    if (!promo) throw new NotFoundException(`Promotion #${id} not found`);
    return promo;
  }

  async create(
    dto: CreatePromotionDto,
    actorId: number,
  ): Promise<PromotionWithTargets> {
    this.validateRules(
      dto.discountType,
      dto.discountValue,
      new Date(dto.validFrom),
      new Date(dto.validTo),
    );
    if (dto.code) await this.assertCodeFree(dto.code);

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
      userId: actorId,
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
    actorId: number,
  ): Promise<PromotionWithTargets> {
    const current = await this.findById(id);

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
      userId: actorId,
      action: AuditAction.PromotionUpdated,
      subjectType: 'Promotion',
      subjectId: id,
    });
    return this.findById(id);
  }

  async remove(id: number, actorId: number): Promise<void> {
    const promo = await this.findById(id);
    const usages = await this.promoRepo.countUsages(id);
    if (usages > 0) {
      throw new ConflictException(
        `Cannot delete a promotion with ${usages} recorded usage(s)`,
      );
    }
    await this.promoRepo.delete(id);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.PromotionDeleted,
      subjectType: 'Promotion',
      subjectId: id,
      metadata: { name: promo.name },
    });
  }

  async listUsages(id: number): Promise<PromotionUsage[]> {
    await this.findById(id); // 404 if missing
    return this.promoRepo.listUsages(id);
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
