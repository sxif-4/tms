import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditAction } from '../../shared/enums/audit-action.enum';
import { Role } from '../../shared/enums/role.enum';
import { UsersRepository, UserWithRole } from './users.repository';

const BCRYPT_ROUNDS = 12;

interface CreateVisitorInput {
  name: string;
  email: string;
  passwordHash: string;
}

interface CreateStaffInput {
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface StaffCreated {
  user: UserWithRole;
  /** Plaintext temporary password — surfaced to the admin once, never stored. */
  temporaryPassword: string;
}

/** Unambiguous characters (no 0/O/1/l/I) for a readable one-time password. */
const TEMP_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generateTemporaryPassword(length = 12): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length];
  }
  return out;
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

  search(query?: string): Promise<UserWithRole[]> {
    return this.usersRepo.search(query, 20);
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

  /**
   * Admin-driven account creation for staff (or a visitor). Generates a
   * one-time password, returned to the admin exactly once; the caller is
   * expected to relay it to the new user out of band.
   */
  async createStaff(
    input: CreateStaffInput,
    actorId: number,
  ): Promise<StaffCreated> {
    if (input.role === Role.Admin) {
      throw new ForbiddenException('Cannot create another admin account');
    }
    if (await this.usersRepo.emailExists(input.email)) {
      throw new ConflictException('Email already registered');
    }

    const role = await this.usersRepo.findRoleBySlug(input.role);
    if (!role) {
      throw new InternalServerErrorException(
        `${input.role} role is not seeded — run \`npm run db:seed\``,
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
    const created = await this.usersRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      roleId: role.id,
      phone: input.phone,
    });

    await this.audit.record({
      userId: actorId,
      action: AuditAction.UserCreated,
      subjectType: 'User',
      subjectId: created.id,
      metadata: { role: input.role },
    });

    return { user: { ...created, role: input.role }, temporaryPassword };
  }

  activate(id: number, actorId: number): Promise<UserWithRole> {
    return this.setActive(id, true, actorId, AuditAction.UserActivated);
  }

  deactivate(id: number, actorId: number): Promise<UserWithRole> {
    return this.setActive(id, false, actorId, AuditAction.UserDeactivated);
  }

  private async setActive(
    id: number,
    isActive: boolean,
    actorId: number,
    action: AuditAction,
  ): Promise<UserWithRole> {
    await this.findByIdWithRole(id); // 404 if missing
    await this.usersRepo.setActive(id, isActive);
    await this.audit.record({
      userId: actorId,
      action,
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
