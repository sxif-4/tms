import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionsService } from './promotions.service';

const admin: AuthenticatedUser = { id: 1, email: 'admin@example.com', role: Role.Admin };

const baseDto = (
  over: Partial<CreatePromotionDto> = {},
): CreatePromotionDto => ({
  name: 'Promo',
  description: 'desc',
  discountType: 'fixed',
  discountValue: '5.00',
  validFrom: '2026-01-01',
  validTo: '2026-02-01',
  ...over,
});

describe('PromotionsService', () => {
  let service: PromotionsService;
  let repo: {
    findByIdWithTargets: jest.Mock;
    findByCode: jest.Mock;
    create: jest.Mock;
    replaceTargets: jest.Mock;
    delete: jest.Mock;
    countUsages: jest.Mock;
  };
  let roomTypesRepo: { hotelIdsUsingRoomType: jest.Mock };
  let hotelAccess: { scopedHotelIds: jest.Mock };
  let audit: { record: jest.Mock };

  beforeEach(() => {
    repo = {
      findByIdWithTargets: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      replaceTargets: jest.fn(),
      delete: jest.fn(),
      countUsages: jest.fn(),
    };
    roomTypesRepo = { hotelIdsUsingRoomType: jest.fn() };
    hotelAccess = { scopedHotelIds: jest.fn() };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new PromotionsService(
      repo as never,
      roomTypesRepo as never,
      hotelAccess as never,
      audit as never,
    );
  });

  it('rejects a validFrom on/after validTo', async () => {
    await expect(
      service.create(
        baseDto({ validFrom: '2026-02-01', validTo: '2026-01-01' }),
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a percentage discount over 100', async () => {
    await expect(
      service.create(
        baseDto({ discountType: 'percentage', discountValue: '150' }),
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks deleting a promotion that has usages', async () => {
    repo.findByIdWithTargets.mockResolvedValue({
      id: 1,
      name: 'P',
      targets: [],
    });
    repo.countUsages.mockResolvedValue(3);

    await expect(service.remove(1, admin)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes a promotion with no usages and audits it', async () => {
    repo.findByIdWithTargets.mockResolvedValue({
      id: 1,
      name: 'P',
      targets: [],
    });
    repo.countUsages.mockResolvedValue(0);

    await service.remove(1, admin);

    expect(repo.delete).toHaveBeenCalledWith(1);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.PromotionDeleted }),
    );
  });
});
