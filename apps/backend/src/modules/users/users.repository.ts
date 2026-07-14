import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, like, or } from 'drizzle-orm';
import {
  DRIZZLE,
  type DrizzleDB,
} from '../../shared/database/drizzle.constants';
import {
  type NewUser,
  type Role as RoleRow,
  type User,
  roles,
  users,
} from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';

/** A user row joined with its role slug. */
export interface UserWithRole extends User {
  role: Role;
}

/**
 * Sole owner of Drizzle queries for users/roles. Keeps the service layer
 * focused on business logic (arch-use-repository-pattern).
 *
 * better-sqlite3 is synchronous, so these methods wrap their results in a
 * resolved Promise to keep an async, driver-agnostic repository interface.
 */
@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  emailExists(email: string): Promise<boolean> {
    const row = this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .get();
    return Promise.resolve(!!row);
  }

  findByEmailWithRole(email: string): Promise<UserWithRole | undefined> {
    return Promise.resolve(this.joinRole(eq(users.email, email)));
  }

  findByIdWithRole(id: number): Promise<UserWithRole | undefined> {
    return Promise.resolve(this.joinRole(eq(users.id, id)));
  }

  findAllWithRole(): Promise<UserWithRole[]> {
    const rows = this.db
      .select({ user: users, slug: roles.slug })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .all();
    return Promise.resolve(
      rows.map((r) => ({ ...r.user, role: r.slug as Role })),
    );
  }

  /** Name/email search for staff-facing pickers (e.g. the ferry booking form). */
  search(query: string | undefined, limit: number): Promise<UserWithRole[]> {
    const base = this.db
      .select({ user: users, slug: roles.slug })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id));

    const trimmed = query?.trim();
    const rows = (
      trimmed
        ? base.where(
            or(
              like(users.name, `%${trimmed}%`),
              like(users.email, `%${trimmed}%`),
            ),
          )
        : base
    )
      .orderBy(asc(users.name))
      .limit(limit)
      .all();
    return Promise.resolve(
      rows.map((r) => ({ ...r.user, role: r.slug as Role })),
    );
  }

  findRoleBySlug(slug: Role): Promise<RoleRow | undefined> {
    return Promise.resolve(
      this.db.select().from(roles).where(eq(roles.slug, slug)).get(),
    );
  }

  create(data: NewUser): Promise<User> {
    return Promise.resolve(
      this.db.insert(users).values(data).returning().get(),
    );
  }

  setActive(id: number, isActive: boolean): Promise<void> {
    this.db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .run();
    return Promise.resolve();
  }

  updateRole(id: number, roleId: number): Promise<void> {
    this.db
      .update(users)
      .set({ roleId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .run();
    return Promise.resolve();
  }

  private joinRole(where: ReturnType<typeof eq>): UserWithRole | undefined {
    const row = this.db
      .select({ user: users, slug: roles.slug })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(where)
      .get();
    if (!row) return undefined;
    return { ...row.user, role: row.slug as Role };
  }
}
