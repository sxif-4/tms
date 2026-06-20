import * as bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from '../schema';
import { roles, users } from '../schema';

const ROLE_SEED = [
  { slug: 'visitor', name: 'Visitor' },
  { slug: 'hotel_staff', name: 'Hotel Staff' },
  { slug: 'ferry_staff', name: 'Ferry Staff' },
  { slug: 'park_staff', name: 'Park Staff' },
  { slug: 'admin', name: 'Admin' },
];

async function main(): Promise<void> {
  const path = process.env.DATABASE_PATH ?? './data/dev.db';
  mkdirSync(dirname(path), { recursive: true });

  const sqlite = new Database(path);
  const db = drizzle(sqlite, { schema });

  // Roles — idempotent by slug.
  for (const role of ROLE_SEED) {
    db.insert(roles)
      .values(role)
      .onConflictDoNothing({ target: roles.slug })
      .run();
  }
  console.log(`✅ Seeded ${ROLE_SEED.length} roles`);

  // Initial admin account.
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  const existing = db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .get();
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  } else {
    const adminRole = db
      .select()
      .from(roles)
      .where(eq(roles.slug, 'admin'))
      .get();
    if (!adminRole) throw new Error('admin role missing after seed');

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    db.insert(users)
      .values({
        name: 'Administrator',
        email: adminEmail,
        passwordHash,
        roleId: adminRole.id,
      })
      .run();
    console.log(`✅ Seeded admin: ${adminEmail}`);
  }

  // Staff accounts — one per staff role (a user holds a single role), idempotent
  // by email. Override the shared password with STAFF_PASSWORD if needed.
  const STAFF_SEED = [
    {
      name: 'Hotel Staff',
      email: 'hotel@example.com',
      roleSlug: 'hotel_staff',
    },
    {
      name: 'Ferry Staff',
      email: 'ferry@example.com',
      roleSlug: 'ferry_staff',
    },
    { name: 'Park Staff', email: 'park@example.com', roleSlug: 'park_staff' },
  ];
  const staffPassword = process.env.STAFF_PASSWORD ?? 'ChangeMe123!';
  const staffPasswordHash = await bcrypt.hash(staffPassword, 12);

  for (const staff of STAFF_SEED) {
    const exists = db
      .select()
      .from(users)
      .where(eq(users.email, staff.email))
      .get();
    if (exists) {
      console.log(`ℹ️  Staff already exists: ${staff.email}`);
      continue;
    }

    const staffRole = db
      .select()
      .from(roles)
      .where(eq(roles.slug, staff.roleSlug))
      .get();
    if (!staffRole)
      throw new Error(`${staff.roleSlug} role missing after seed`);

    db.insert(users)
      .values({
        name: staff.name,
        email: staff.email,
        passwordHash: staffPasswordHash,
        roleId: staffRole.id,
      })
      .run();
    console.log(`✅ Seeded staff: ${staff.email} (${staff.roleSlug})`);
  }

  console.log('✅ Seed complete');
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
