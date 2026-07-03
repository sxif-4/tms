import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    emailExists: jest.Mock;
    findRoleBySlug: jest.Mock;
    create: jest.Mock;
    findByIdWithRole: jest.Mock;
    updateRole: jest.Mock;
    setActive: jest.Mock;
  };
  let audit: { record: jest.Mock };

  beforeEach(() => {
    repo = {
      emailExists: jest.fn(),
      findRoleBySlug: jest.fn(),
      create: jest.fn(),
      findByIdWithRole: jest.fn(),
      updateRole: jest.fn(),
      setActive: jest.fn(),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new UsersService(repo as never, audit as never);
  });

  describe('createStaff', () => {
    it('refuses to create another admin', async () => {
      await expect(
        service.createStaff(
          { name: 'X', email: 'x@e.com', role: Role.Admin },
          1,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate email', async () => {
      repo.emailExists.mockResolvedValue(true);
      await expect(
        service.createStaff(
          { name: 'X', email: 'dupe@e.com', role: Role.HotelStaff },
          1,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the account, returns a temp password and audits', async () => {
      repo.emailExists.mockResolvedValue(false);
      repo.findRoleBySlug.mockResolvedValue({ id: 2 });
      repo.create.mockResolvedValue({ id: 10, name: 'X', email: 'x@e.com' });

      const result = await service.createStaff(
        { name: 'X', email: 'x@e.com', role: Role.HotelStaff },
        7,
      );

      expect(result.temporaryPassword).toHaveLength(12);
      expect(result.user.role).toBe(Role.HotelStaff);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'x@e.com', roleId: 2 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          action: AuditAction.UserCreated,
          subjectId: 10,
        }),
      );
    });
  });

  describe('updateRole', () => {
    it('records the from/to transition', async () => {
      repo.findByIdWithRole
        .mockResolvedValueOnce({ id: 5, role: Role.Visitor })
        .mockResolvedValueOnce({ id: 5, role: Role.HotelStaff });
      repo.findRoleBySlug.mockResolvedValue({ id: 2 });

      await service.updateRole(5, Role.HotelStaff, 1);

      expect(repo.updateRole).toHaveBeenCalledWith(5, 2);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UserRoleUpdated,
          metadata: { from: Role.Visitor, to: Role.HotelStaff },
        }),
      );
    });
  });

  describe('activate / deactivate', () => {
    it('sets active and audits activation', async () => {
      repo.findByIdWithRole.mockResolvedValue({ id: 5, role: Role.Visitor });
      await service.activate(5, 1);
      expect(repo.setActive).toHaveBeenCalledWith(5, true);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.UserActivated }),
      );
    });
  });
});
