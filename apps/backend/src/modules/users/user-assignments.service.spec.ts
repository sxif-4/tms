import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { UserAssignmentsService } from './user-assignments.service';

describe('UserAssignmentsService', () => {
  let service: UserAssignmentsService;
  let assignmentsRepo: {
    findHotelsForUser: jest.Mock;
    findHotelsForUsers: jest.Mock;
    hotelAssignmentExists: jest.Mock;
    assignHotel: jest.Mock;
    deleteHotelAssignment: jest.Mock;
  };
  let usersRepo: { findByIdWithRole: jest.Mock };
  let hotelsRepo: { findById: jest.Mock };
  let audit: { record: jest.Mock };

  beforeEach(() => {
    assignmentsRepo = {
      findHotelsForUser: jest.fn().mockResolvedValue([]),
      findHotelsForUsers: jest.fn().mockResolvedValue(new Map()),
      hotelAssignmentExists: jest.fn().mockResolvedValue(false),
      assignHotel: jest.fn().mockResolvedValue({ id: 99 }),
      deleteHotelAssignment: jest.fn().mockResolvedValue(true),
    };
    usersRepo = {
      findByIdWithRole: jest
        .fn()
        .mockResolvedValue({ id: 5, name: 'Jane', role: Role.HotelStaff }),
    };
    hotelsRepo = {
      findById: jest.fn().mockResolvedValue({ id: 3, name: 'Velara Resort' }),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new UserAssignmentsService(
      assignmentsRepo as never,
      usersRepo as never,
      hotelsRepo as never,
      audit as never,
    );
  });

  describe('assignHotel', () => {
    it('assigns the hotel and audits it', async () => {
      const result = await service.assignHotel(5, 3, 1);

      expect(result).toEqual({
        assignmentId: 99,
        hotelId: 3,
        name: 'Velara Resort',
      });
      expect(assignmentsRepo.assignHotel).toHaveBeenCalledWith(5, 3);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          action: AuditAction.UserHotelAssigned,
          subjectType: 'User',
          subjectId: 5,
        }),
      );
    });

    it('rejects a user whose role is not hotel_staff', async () => {
      usersRepo.findByIdWithRole.mockResolvedValue({
        id: 5,
        name: 'Jane',
        role: Role.FerryStaff,
      });

      await expect(service.assignHotel(5, 3, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(assignmentsRepo.assignHotel).not.toHaveBeenCalled();
    });

    it('404s on an unknown user', async () => {
      usersRepo.findByIdWithRole.mockResolvedValue(undefined);
      await expect(service.assignHotel(5, 3, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('404s on an unknown hotel', async () => {
      hotelsRepo.findById.mockResolvedValue(undefined);
      await expect(service.assignHotel(5, 3, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(assignmentsRepo.assignHotel).not.toHaveBeenCalled();
    });

    it('409s instead of tripping the unique index twice', async () => {
      assignmentsRepo.hotelAssignmentExists.mockResolvedValue(true);
      await expect(service.assignHotel(5, 3, 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(assignmentsRepo.assignHotel).not.toHaveBeenCalled();
    });
  });

  describe('unassignHotel', () => {
    it('removes the assignment and audits it', async () => {
      await service.unassignHotel(5, 3, 1);

      expect(assignmentsRepo.deleteHotelAssignment).toHaveBeenCalledWith(5, 3);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UserHotelUnassigned,
          subjectId: 5,
        }),
      );
    });

    it('404s when the user was never assigned that hotel', async () => {
      assignmentsRepo.deleteHotelAssignment.mockResolvedValue(false);
      await expect(service.unassignHotel(5, 3, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(audit.record).not.toHaveBeenCalled();
    });
  });
});
