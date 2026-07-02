# Admin Role — Implementation Plan

Scope agreed with the team:

- **User & access management** — extend the existing users page with activate/deactivate + direct staff-account creation. (No `user_assignments` scoping, no edit-details/password-reset this round.)
- **Content: Advertisements & Promotions** — CMS for ads and admin oversight of promotions.
- **Content: Map & Locations** — maintain `map_locations`, presented as an **interactive Leaflet map**.
- **Reports, Analytics & Audit** — real KPI cards + sales/usage reports backed by **actual seeded booking/payment data**, plus an audit-log viewer.

The "Operations" sidebar links (Hotels / Ferries / Theme Park) are **staff-owned features built separately** — this plan does not build their management UIs, only the schemas + seed data their reports need.

---

## 1. Where we are today

**Backend** (NestJS 11 + Drizzle + `better-sqlite3`, strict repository → service → controller layering):

- Auth: JWT access + refresh in httpOnly cookies, `RolesGuard`, `@Roles()` / `@CurrentUser()` / `@Public()` decorators.
- Users module (admin-only): `GET /users`, `GET /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/deactivate`.
  - ⚠️ `deactivate` exists on the API but is **not wired into the frontend**, and there is **no reactivate** endpoint.
- **The full schema is now built.** All 25 tables from [Db_Schema.md](Db_Schema.md) exist as Drizzle schemas (`src/shared/database/schema/*.schema.ts`, one file per table), migrated (`0001_material_nicolaos.sql`) and populated with cross-domain mock data via `seeds/demo.ts` (run by `npm run db:seed`). Only the `roles`/`users`/`refresh_tokens` **modules** exist so far — every other table has data but no service/controller yet. Remaining per-domain work is modules + UI, not schema.

**Frontend** (TanStack Start SSR + TanStack Query + shadcn/ui `radix-nova`):

- Feature-folder convention under `src/features/<name>/`: `server.ts` (server fns that forward httpOnly cookies to the API, with a one-shot 401→refresh→retry), `queries.ts` (`queryOptions`), `pages/`, `components/`, `constants.ts`, `types.ts`.
- Role-based sidebar in [app-shared.tsx](../apps/frontend/src/components/app-shared.tsx). Admin nav placeholders (`#/...`): Analytics, Hotels, Ferries, Theme Park, Payments, Promotions, **Users (live)**, Audit Logs, Roles, Settings.
- `/dashboard` route guard requires an authenticated non-visitor. **There is no admin-only guard** — a `hotel_staff` can currently navigate to `/dashboard/admin/*`; only the API's `@Roles(Role.Admin)` stops them (403). We add a frontend guard in Phase 0.
- Admin dashboard index (`routes/dashboard/admin/index.tsx`) is a `Hello` placeholder; the users list page works (role change only).

---

## 2. Guiding principles (match the existing codebase)

1. **Repository owns Drizzle, service owns rules, controller stays thin.** New backend domains copy the `modules/users/` shape exactly (`*.repository.ts`, `*.service.ts`, `*.controller.ts`, `dto/`, `*.module.ts`).
2. **Admin endpoints are guarded at the controller** with `@Roles(Role.Admin)` (as `UsersController` already does).
3. **Schema is source-of-truth-driven.** Each new table matches [Db_Schema.md](Db_Schema.md) exactly; keep that file in sync if anything changes. One schema file per table under `src/shared/database/schema/`, exported + related in `schema/index.ts`, migration via `db:generate` then `db:migrate`.
4. **Money is `decimal(10,2)`, prices are snapshots.** Reports aggregate `total_amount` / `payments.amount`, never recompute from today's `base_price`.
5. **Frontend follows the feature-folder + server-fn pattern** — never call the API directly from the browser; go through a `createServerFn` that forwards cookies (copy `features/users/server.ts`).
6. **Wire sidebar paths as routes land** — flip each `#/...` placeholder to a real path in `app-shared.tsx` when its route exists.

---

## 3. Data-layer status (Drizzle schemas + migrations)

> ✅ **Done.** The entire schema below is already authored, migrated, and seeded (see §1). This table is now a map of which phase _consumes_ each table, not a build list. `decimal` money/coordinates are stored as `text` (exact, never float-coerced); all temporal columns are `integer` unix timestamps. Add columns here only if a feature needs one — regenerate with `db:generate` + `db:migrate` and keep [Db_Schema.md](Db_Schema.md) in sync.

All tables follow the conventions block at the top of [Db_Schema.md](Db_Schema.md) (bigint PKs, `created_at`/`updated_at`, indexed FKs, enums as typed Drizzle enums).

| Table                                                                              | Phase | Notes                                                                                               |
| ---------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| `audit_logs`                                                                       | 0     | Written by a shared `AuditService`; read by the audit viewer.                                       |
| `advertisements`                                                                   | 2     | Denormalized `image` URL (intentional exception to the polymorphic image system).                   |
| `promotions`, `promotion_targets`, `promotion_usages`                              | 2     | Admin CRUDs promotions + targets; `promotion_usages` is read-only here (written later at checkout). |
| `map_locations`                                                                    | 3     | `latitude`/`longitude` `decimal(10,7)`.                                                             |
| `hotels`, `room_types`, `rooms`, `hotel_bookings`                                  | 4     | Parents seeded; `hotel_bookings.total_amount` drives hotel revenue.                                 |
| `ferry_routes`, `ferry_schedules`, `ferry_bookings`                                | 4     | Ferry revenue + passenger counts.                                                                   |
| `park_ticket_types`, `park_tickets`, `events`, `event_schedules`, `event_bookings` | 4     | Park/event revenue + attendance.                                                                    |
| `payments`                                                                         | 4     | Polymorphic (`payable_type`/`payable_id`); the single source for "sales" totals.                    |

**Built but out of admin scope:** `user_assignments`, `images`/`imageables` — tables + seed data exist for completeness/other teams, but no admin feature in this plan manages them this round.

> **Coordination note:** the hotel/ferry/park booking schemas are now authored + seeded here (Db*Schema.md-aligned). Domain teams build their \_booking/management modules* on top of these existing tables — flag any column change so we regenerate one shared migration rather than colliding.

---

## 4. Phased delivery

Each phase is a vertical slice (backend schema → module → frontend feature → route → sidebar wiring) and maps roughly to a scrum sprint.

### Phase 0 — Foundations (do first)

- **Admin route guard.** Add `routes/dashboard/admin/route.tsx` (layout route) with a `beforeLoad` that redirects non-admins (e.g. to their `landingPathForRole(role)`). Mirrors `routes/dashboard/route.tsx`. Every `admin/*` route inherits it.
- **Real dashboard index.** Replace the `Hello` placeholder in `routes/dashboard/admin/index.tsx` with a shell of KPI cards (values filled in Phase 4). Use shadcn `Card`.
- **Audit foundation (backend).**
  - `schema/audit-logs.schema.ts` + relation + migration.
  - `shared/audit/audit.service.ts` with `record({ userId, action, subjectType, subjectId, metadata })`, exposed via a `SharedModule`/`AuditModule` so any service can inject it.
  - Instrument the existing user mutations (`updateRole`, `deactivate`) as the first audit producers.
- **Enums.** Extend `shared/enums/` as new `status`/`type`/`channel` enums appear, so DTO validation and Drizzle enums share one definition.

### Phase 1 — User & access management

**Backend** (`modules/users/`):

- Add `POST /users` (create staff): body `{ name, email, role, phone? }`, generate a temporary password (return it once, or set a "must reset" flag — decide with team), reuse `usersRepo.create`. Guard: `@Roles(Role.Admin)`; reject creating another `admin` (keep the single-admin invariant in `ASSIGNABLE_ROLES`).
- Add `PATCH /users/:id/activate` (or generalize to `PATCH /users/:id { isActive }`) — repository `setActive(id, true)` already supports it; just needs the endpoint.
- Keep the self-guard (`can't change/deactivate your own account`).

**Frontend** (`features/users/`):

- Extend `server.ts` with `createStaffServerFn` + `setUserActiveServerFn`.
- `UserCard`: add active/inactive `Badge` + an actions menu (Change role / Deactivate / Reactivate).
- New `CreateStaffDialog` (name, email, role from `ASSIGNABLE_ROLES`, phone). Show the generated temp password on success via `toast` + a copyable field.
- Filter/tab the list by role and active state (client-side is fine at this scale).

### Phase 2 — Content: Advertisements & Promotions

**Backend**:

- `modules/advertisements/` — full CRUD (`GET/POST/PATCH/DELETE /advertisements`), fields per schema (`title`, `image`, `target_url`, `placement`, `starts_at`, `ends_at`, `is_active`). Public read endpoint for the homepage banner can come later; admin CRUD is `@Roles(Role.Admin)`.
- `modules/promotions/` — CRUD `promotions` + nested `promotion_targets` (`target_type`: room_type/event/ferry_route, `target_id`). Validate `discount_type`/`discount_value`, `valid_from < valid_to`, unique `code`. `GET /promotions/:id/usages` is read-only.
- Audit each mutation via `AuditService`.

**Frontend**:

- `features/advertisements/` — list (cards/table), create/edit dialog, image URL field (file upload out of scope; store URL), active toggle, delete confirm. Route `routes/dashboard/admin/ads/`.
- `features/promotions/` — list + create/edit form (discount type/value, min spend, limits, validity window, targets multi-select), usages read view. Route `routes/dashboard/admin/promotions/`.
- Wire the `Promotions` (and a new `Advertisements`) sidebar entries.

### Phase 3 — Content: Map & Locations (Leaflet)

**Backend**:

- `modules/map-locations/` — CRUD for `map_locations` (`name`, `description`, `type`, `latitude`, `longitude`). `@Roles(Role.Admin)` for writes; a public GET can be exposed later for the visitor map.

**Frontend**:

- Add deps: `leaflet`, `react-leaflet`, `@types/leaflet`.
- **SSR caveat:** Leaflet touches `window` — render the map **client-only** (mount guard / dynamic import / a `<ClientOnly>` wrapper), or SSR will crash. Load Leaflet CSS in the route, not globally.
- `features/map-locations/` — split view: interactive map with draggable markers on the left, editable list on the right. Click map to place a new location (captures lat/long), click a marker to edit/delete. Route `routes/dashboard/admin/map/`; wire the sidebar `Map`/`Locations` entry.

### Phase 4 — Reports, Analytics & Audit viewer

**Backend — schema + seed:** ✅ already done. The booking/payment schemas exist and `seeds/demo.ts` seeds a spread of `hotel_bookings` / `ferry_bookings` / `park_tickets` / `event_bookings` across past & upcoming dates with matching `payments` (mix of `completed`/`pending`/`refunded`) — so every report has real numbers. Remaining backend work is just the aggregation module:

- `modules/reports/` — read-only aggregation queries (all `@Roles(Role.Admin)`):
  - `GET /reports/overview` — KPI cards: total users, active bookings, revenue (sum `payments.amount` where completed), tickets sold.
  - `GET /reports/sales?from&to&groupBy` — revenue over time, split by domain (hotel/ferry/park/event) via `payments.payable_type`.
  - `GET /reports/usage` — bookings/attendance counts, capacity utilization (sum `passenger_count`/`quantity` vs `capacity`).

**Frontend**:

- Fill the Phase-0 dashboard KPI cards from `/reports/overview`.
- `features/reports/` — Analytics page with charts (add `recharts`) for sales-over-time and per-domain breakdown; date-range filter. Routes `routes/dashboard/admin/analytics/` (+ optional `reports/`). Wire the `Analytics` sidebar entry.
- `features/audit-logs/` — paginated table of `audit_logs` (who / action / subject / when, expandable metadata), filter by action/user. Backend `GET /audit-logs` (paginated) in the audit module. Route `routes/dashboard/admin/audit-logs/`; wire the sidebar entry.

### Phase 5 — Polish

- **Settings** page (`routes/dashboard/admin/settings/`) — light: profile, maybe app-level toggles. Low priority; can stay a placeholder if time-boxed.
- **Roles** sidebar entry — largely redundant with Users; either point it at a read-only roles reference or drop it from the nav.
- Empty/loading/error states, `check-types`, and a pass of backend `*.spec.ts` for the new services (mirror any existing users specs).

---

## 5. Cross-cutting concerns

- **Frontend RBAC gap** — Phase 0's `admin/route.tsx` guard is a real fix, not cosmetic; without it staff can reach admin pages (and just see 403s from the API).
- **Audit everywhere** — route _all_ admin mutations (users, ads, promotions, locations) through `AuditService` so the Phase-4 viewer is populated from day one.
- **Leaflet + SSR** — must be client-only; don't import it at module top level in an SSR route.
- **Seed idempotency** — keep new seed data idempotent (guard by unique refs/emails) like the existing role/admin/staff seed, so re-running `db:seed` is safe.
- **Keep [Db_Schema.md](Db_Schema.md) authoritative** — update it if any column/enum shifts during implementation.

---

## 6. Suggested build order (checklist)

- [x] **P0** admin route guard → real dashboard shell → `audit_logs` table + `AuditService` (instrument user mutations) ✅
- [x] **P1** create-staff + activate/deactivate (backend endpoints → users feature UI) ✅
- [ ] **P2** advertisements CRUD → promotions CRUD (+ audit) → routes + sidebar
- [ ] **P3** `map_locations` CRUD → Leaflet client-only map feature → route + sidebar
- [ ] **P4** booking/payment schemas + demo seed → reports module → dashboard KPIs + analytics charts + audit-log viewer
- [ ] **P5** settings/roles polish, specs, empty/error states, `check-types`

---

## 7. Open decisions to confirm with the team

1. **Staff account creation** — temp password returned once, vs. an emailed invite/reset link (email infra doesn't exist yet → temp password is the pragmatic pick).
2. **Phase-4 schema ownership** — confirm hotel/ferry/park domain owners are OK with this plan authoring their tables + seed, and building their modules on top.
3. **Chart library** — `recharts` (assumed) vs. another; and whether Analytics + Reports are one page or two.
4. **Roles sidebar entry** — keep as a read-only reference or remove.
