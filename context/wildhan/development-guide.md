# Development Guide

This document is the working guide to follow during development on the TMS booking system. It starts from [CLAUDE.md](../../CLAUDE.md) and adds conventions, workflow, and pointers to the rest of the project context.

---

## What this is

Online booking system for a theme-park / picnic-island tourism company (university DESD group project). It serves five roles — `visitor`, `hotel_staff`, `ferry_staff`, `park_staff`, `admin` — across hotel, ferry, theme-park, payments, and promotions domains. The functional spec is in [requirements.md](../requirements.md) and the authoritative data model is in [Db_Schema.md](../Db_Schema.md).

---

## Monorepo layout

Turborepo + **npm workspaces** (`npm@11.12.1`, Node >= 18). Two apps and three packages:

- [apps/backend](../../apps/backend) — NestJS 11 API (port **4000**).
- [apps/frontend](../../apps/frontend) — TanStack Start SSR app (port **3000**).
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` — **leftovers from the `create-turbo` Next.js starter.** Neither app depends on `@repo/*`; each app carries its own `tsconfig`/eslint. `turbo.json`'s `.next/**` build outputs are also starter residue. Don't assume `@repo/ui` is the shared component library — it isn't wired in.

---

## Commands

Run from the repo root (`tms/`, Turborepo fans out to workspaces):

```sh
npm run dev          # all apps in watch mode
npm run build        # build all
npm run lint         # lint all (frontend has no lint script, so it's skipped)
npm run check-types  # tsc --noEmit across workspaces
npm run format       # prettier across the repo
```

Target one app with a filter: `turbo dev --filter=frontend`, `turbo build --filter=backend`.

### Backend (`cd apps/backend`)

```sh
npm run dev          # nest start --watch
npm test             # jest (unit, *.spec.ts under src)
npm test -- app.controller   # run a single test by name/path
npm run test:e2e     # jest with test/jest-e2e.json
npm run test:cov     # coverage
```

Database scripts (Drizzle ORM + SQLite):

```sh
npm run db:generate  # generate migration from schema changes
npm run db:push      # push schema directly (dev only)
npm run db:migrate   # run migrations (tsx src/shared/database/migrate.ts)
npm run db:seed      # seed demo data (tsx src/shared/database/seeds/seed.ts)
```

The data layer lives under `src/shared/database/` (schemas, migrations, seeds). Auth, users, reports, promotions, and map-locations modules are in place; other domains still need modules + UI on top of the existing schema and seed data.

### Frontend (`cd apps/frontend`)

```sh
npm run dev          # vite dev (port 3000)
npm run build        # vite build && tsc --noEmit
npm run preview      # preview production build
```

No test runner or lint script is configured for the frontend yet.

---

## Frontend architecture notes

- **TanStack Start + TanStack Router**, file-based routing under `src/routes/`. `src/routeTree.gen.ts` is **auto-generated** — never edit it by hand; it regenerates from route files on dev/build.
- `getRouter()` in [apps/frontend/src/router.tsx](../../apps/frontend/src/router.tsx) wires a per-request `QueryClient` into the router context and bridges TanStack Query with SSR via `setupRouterSsrQueryIntegration`. Use the query client from route context, not a global.
- Import alias `~/*` → `src/*` (see `tsconfig.json` paths + Vite `tsconfigPaths`).
- **shadcn/ui** (style `radix-nova`, base color `zinc`, lucide icons). Components live in `~/components/ui`, the `cn()` helper in `~/lib/utils`. Use the shadcn skill / `npx shadcn add` to add components. Tailwind v4 via `@tailwindcss/vite`; global styles in `~/styles/app.css`.
- HTTP client is **redaxios** (axios-compatible, lightweight).

For detailed frontend patterns (feature folders, routing, server functions, queries), follow [frontend-guideline.md](../frontend-guideline.md).

---

## Backend architecture notes

- **Layering:** repository owns Drizzle queries, service owns business rules, controller stays thin. Copy the shape of `modules/users/` for new domains (`*.repository.ts`, `*.service.ts`, `*.controller.ts`, `dto/`, `*.module.ts`).
- **Auth:** JWT access + refresh in httpOnly cookies. Global guards: `ThrottlerGuard` → `JwtAuthGuard` (honors `@Public()`) → `RolesGuard` (reads `@Roles()`). Use `@CurrentUser()` to read the authenticated user in controllers.
- **Schema:** one Drizzle schema file per table under `src/shared/database/schema/`, exported from `schema/index.ts`. Keep [Db_Schema.md](../Db_Schema.md) in sync when anything changes; run `db:generate` then `db:migrate`.
- **API prefix:** `api/v1/...`

For auth setup details, see [authPlan.md](../authPlan.md). For admin-scope work, see [adminPlan.md](../adminPlan.md).

---

## Data model & business rules (enforced in application code)

The DB can't express these — they must be checked in the backend service layer:

- **RBAC:** one role per user (`users.role_id`). Staff authority is scoped by `user_assignments` (role = what they can do, assignment = which hotels/routes/etc.). Fine-grained permission-per-role lives in app code, not the DB.
- **Cross-domain prerequisites:** a ferry booking requires a valid hotel booking (`ferry_bookings.hotel_booking_id`); an event booking requires a park ticket (`event_bookings.park_ticket_id`).
- **Availability:** room double-booking (no-overlap) checks and ferry/event capacity checks (sum `passenger_count`/`quantity` vs `capacity`) are application-enforced.
- **Money:** always `decimal(10,2)`, never floats. Bookings store a `total_amount` price snapshot at purchase time — reports/receipts reflect what was charged, not the current `base_price`.
- **Polymorphic patterns** recur: `images`/`imageables`, `payments` (`payable_type`/`payable_id`), `promotion_targets`, `user_assignments`, `audit_logs` (`subject_type`/`subject_id`). Advertisements are the one intentional exception (denormalized `image` URL).

When changing anything data-related, treat [Db_Schema.md](../Db_Schema.md) as the source of truth and keep it in sync.

---

## Development workflow

### Before you start

1. Read the relevant section of [requirements.md](../requirements.md) for the feature you are building.
2. Check [Db_Schema.md](../Db_Schema.md) for tables, FKs, and constraints involved.
3. Look for an existing plan in `context/` (e.g. [authPlan.md](../authPlan.md), [adminPlan.md](../adminPlan.md)) before inventing a new approach.
4. Scan existing code in the same domain — match naming, folder layout, and patterns already in use.

### While implementing

1. **Minimize scope.** Only change what the task requires. Don't refactor unrelated code.
2. **Backend first for new data.** Schema → migration → repository → service → controller → DTOs. Enforce business rules in the service layer, not in controllers or the DB alone.
3. **Frontend through server functions.** Never call the API directly from the browser. Use `createServerFn` in `features/<name>/server.ts` to forward httpOnly cookies (copy `features/users/server.ts`).
4. **Feature folders.** Each frontend feature lives under `src/features/<name>/` with `pages/`, `components/`, `server.ts`, `queries.ts`, `types.ts`, and `constants.ts` as needed.
5. **Thin route files.** Routes in `src/routes/` should only wire loaders, guards, and page components — keep logic in features.
6. **Role guards on both sides.** Backend: `@Roles(...)` on controllers. Frontend: route guards for role-restricted sections (admin dashboard, staff tools).
7. **Wire navigation when routes land.** Update sidebar links in `app-shared.tsx` from `#/...` placeholders to real paths as features ship.

### Before opening a PR

1. Run `npm run check-types` from the repo root.
2. Run `npm test` in `apps/backend` for anything touching backend logic.
3. Run `npm run build` if you touched build config, SSR, or shared types.
4. Confirm schema changes have a migration and an updated [Db_Schema.md](../Db_Schema.md) if the model changed.
5. Manually smoke-test the happy path in the browser.

---

## Code conventions (quick reference)

| Area | Convention |
|------|------------|
| Files | `kebab-case` |
| React components | `PascalCase` |
| Server functions | `camelCase` + `ServerFn` suffix |
| Query helpers | `camelCase` + `QueryOptions` suffix |
| Route tree | Auto-generated — do not hand-edit `routeTree.gen.ts` |
| Import alias | `~/*` → `src/*` |
| Money | `decimal(10,2)`, snapshot at purchase time |
| UI components | shadcn/ui in `~/components/ui`, add via `npx shadcn add` |

---

## Reference documents

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](../../CLAUDE.md) | Base repo guide for AI assistants |
| [requirements.md](../requirements.md) | Functional spec by role |
| [Db_Schema.md](../Db_Schema.md) | Authoritative data model |
| [frontend-guideline.md](../frontend-guideline.md) | Frontend structure and patterns |
| [authPlan.md](../authPlan.md) | Auth layer design and decisions |
| [adminPlan.md](../adminPlan.md) | Admin role implementation plan |

When in doubt, follow existing code in the same module before introducing a new pattern.
