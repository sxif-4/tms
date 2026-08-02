import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { HotelsService } from './hotels.service';

describe('HotelsService', () => {
  let service: HotelsService;
  let hotelsRepo: {
    findAll: jest.Mock;
    findByIds: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    setActive: jest.Mock;
    nameExists: jest.Mock;
  };
  let locationsRepo: { findById: jest.Mock };
  let hotelAccess: { scopedHotelIds: jest.Mock; assertHotelAccess: jest.Mock };
  let audit: { record: jest.Mock };

  const hotel = { id: 1, name: 'Velara', maxRooms: 40, isActive: true };

  beforeEach(() => {
    hotelsRepo = {
      findAll: jest.fn().mockResolvedValue([hotel]),
      findByIds: jest.fn().mockResolvedValue([hotel]),
      findById: jest.fn().mockResolvedValue(hotel),
      create: jest.fn().mockResolvedValue(hotel),
      update: jest.fn().mockResolvedValue(hotel),
      setActive: jest.fn().mockResolvedValue(undefined),
      nameExists: jest.fn().mockResolvedValue(false),
    };
    locationsRepo = { findById: jest.fn().mockResolvedValue({ id: 2 }) };
    hotelAccess = {
      scopedHotelIds: jest.fn().mockResolvedValue('all'),
      assertHotelAccess: jest.fn().mockResolvedValue(undefined),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new HotelsService(
      hotelsRepo as never,
      locationsRepo as never,
      hotelAccess as never,
      audit as never,
    );
  });

  describe('create', () => {
    it('creates the hotel and audits it', async () => {
      const result = await service.create({ name: 'Velara', maxRooms: 40 }, 7);

      expect(result).toBe(hotel);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          action: AuditAction.HotelCreated,
          subjectType: 'Hotel',
        }),
      );
    });

    it('rejects a duplicate name', async () => {
      hotelsRepo.nameExists.mockResolvedValue(true);
      await expect(
        service.create({ name: 'Velara', maxRooms: 40 }, 7),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(hotelsRepo.create).not.toHaveBeenCalled();
    });

    it('404s on an unknown map location instead of tripping the FK', async () => {
      locationsRepo.findById.mockResolvedValue(undefined);
      await expect(
        service.create({ name: 'Velara', maxRooms: 40, mapLocationId: 99 }, 7),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(hotelsRepo.create).not.toHaveBeenCalled();
    });

    it('skips location validation when none is given', async () => {
      await service.create({ name: 'Velara', maxRooms: 40 }, 7);
      expect(locationsRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('allows keeping the existing name', async () => {
      hotelsRepo.nameExists.mockResolvedValue(true);
      await expect(service.update(1, { name: 'Velara' }, 7)).resolves.toBe(
        hotel,
      );
    });

    it('rejects renaming onto another hotel', async () => {
      hotelsRepo.nameExists.mockResolvedValue(true);
      await expect(
        service.update(1, { name: 'Coral Lagoon' }, 7),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('deactivate', () => {
    it('suspends the hotel and audits it', async () => {
      await service.deactivate(1, 7);

      expect(hotelsRepo.setActive).toHaveBeenCalledWith(1, false);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.HotelDeactivated,
          subjectId: 1,
        }),
      );
    });

    it('404s on an unknown hotel', async () => {
      hotelsRepo.findById.mockResolvedValue(undefined);
      await expect(service.deactivate(1, 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(hotelsRepo.setActive).not.toHaveBeenCalled();
    });
  });

  describe('listForUser', () => {
    it('returns every hotel for admins', async () => {
      await service.listForUser({ id: 1 } as never);
      expect(hotelsRepo.findAll).toHaveBeenCalled();
    });

    it('returns only assigned hotels for staff', async () => {
      hotelAccess.scopedHotelIds.mockResolvedValue([1]);
      await service.listForUser({ id: 2 } as never);
      expect(hotelsRepo.findByIds).toHaveBeenCalledWith([1]);
    });
  });
});
