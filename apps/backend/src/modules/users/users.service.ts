import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { UsersRepository, UserWithRole } from './users.repository';

interface CreateVisitorInput {
  name: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  findByEmailWithRole(email: string): Promise<UserWithRole | undefined> {
    return this.usersRepo.findByEmailWithRole(email);
  }

  async findByIdWithRole(id: number): Promise<UserWithRole> {
    const user = await this.usersRepo.findByIdWithRole(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  listAll(): Promise<UserWithRole[]> {
    return this.usersRepo.findAllWithRole();
  }

  async createVisitor(input: CreateVisitorInput): Promise<UserWithRole> {
    if (await this.usersRepo.emailExists(input.email)) {
      throw new ConflictException('Email already registered');
    }

    const role = await this.usersRepo.findRoleBySlug(Role.Visitor);
    if (!role) {
      throw new InternalServerErrorException(
        'visitor role is not seeded — run `npm run db:seed`',
      );
    }

    const created = await this.usersRepo.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      roleId: role.id,
    });
    return { ...created, role: Role.Visitor };
  }

  async deactivate(id: number, actorId: number): Promise<UserWithRole> {
    await this.findByIdWithRole(id); // 404 if missing
    await this.usersRepo.setActive(id, false);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UserDeactivated,
      subjectType: 'User',
      subjectId: id,
    });
    return this.findByIdWithRole(id);
  }

  /** Reassigns a user to a different role (admin-driven). */
  async updateRole(
    id: number,
    role: Role,
    actorId: number,
  ): Promise<UserWithRole> {
    const existing = await this.findByIdWithRole(id); // 404 if missing

    const roleRow = await this.usersRepo.findRoleBySlug(role);
    if (!roleRow) {
      throw new InternalServerErrorException(
        `${role} role is not seeded — run \`npm run db:seed\``,
      );
    }

    await this.usersRepo.updateRole(id, roleRow.id);
    await this.audit.record({
      userId: actorId,
      action: AuditAction.UserRoleUpdated,
      subjectType: 'User',
      subjectId: id,
      metadata: { from: existing.role, to: role },
    });
    return this.findByIdWithRole(id);
  }
}
