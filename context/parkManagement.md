# Theme Park Management / Ticketing Staff — Implementation Plan

Covers requirement §4 (Theme Park Management / Ticketing Staff) from
[requirements.md](requirements.md), plus the visitor-facing park purchase flow that feeds it.

---

## 1. Where we're starting from

**Backend — the park domain is entirely unbuilt.**
The Drizzle schema exists (`events`, `event_schedules`, `event_bookings`, `park_tickets`,
`park_ticket_types`) and `seeds/demo.ts` already inserts sample rows, but there is **no
`modules/park*` or `modules/event*` code at all**. Everything below is greenfield.

**The hotel domain is our reference implementation.** It is the only fully-realised vertical
slice, and this plan mirrors it deliberately — module-for-module, pattern-for-pattern:

| Hotel module        | Park equivalent      | Role                                     |
| ------------------- | -------------------- | ---------------------------------------- |
| `room-types`        | `park-ticket-types`  | Priced catalog                           |
| `hotels`            | `events`             | The managed entity                       |
| `rooms`             | `event-schedules`    | Child rows, listed via `?parentId=`      |
| `hotel-bookings`    | `event-bookings`     | Staff management + visitor create/mine   |
| —                   | `park-tickets`       | Sales (online + gate) and gate check-in  |
| —                   | `park-days`          | Per-day ticket capacity (**new table**)  |
| `hotel-dashboard`   | `park-dashboard`     | KPIs, capacity monitoring                |
| `hotel-reports`     | `park-reports`       | Sales / visitor reports                  |
| `public-hotels`     | `public-park`        | Unauthenticated browsing                 |

**Do not copy the ferry module.** It is a thin CRUD scaffold with no `@Roles()` guards, no
capacity checks, no audit logging — and it isn't even registered in
[app.module.ts](../apps/backend/src/app.module.ts), so its routes are dead. Its frontend pages
render hardcoded mock arrays. Follow hotel.

**Frontend — a stub.** [dashboard/park/index.tsx](../apps/frontend/src/routes/dashboard/park/index.tsx)
renders `Hello "/dashboard/park/"!`. There is no `dashboard/park/route.tsx` role guard (hotel and
admin both have one). The `park_staff` sidebar entries in
[app-shared.tsx](../apps/frontend/src/components/app-shared.tsx) are all `#/` placeholders. The
public [/theme-park](../apps/frontend/src/routes/theme-park/index.tsx) page is a "coming soon"
marketing page with a hardcoded `TICKET_TIERS` array.

---

## 2. Decisions taken

1. **Scope: staff module + visitor purchase flow.** Building both closes the park domain
   end-to-end — visitors buy tickets and book events, staff manage and validate them.
2. **Add a `park_day_capacities` table.** The requirement _"Manage availability of tickets for
   specific days"_ has nothing backing it today; no table caps how many park tickets can be sold
   for a given date. See §3.
3. **Park-wide RBAC, no per-event scoping.** Any `park_staff` manages all events, tickets and
   sales. There is only one theme park, so `user_assignments` scoping (as `HotelAccessService`
   does for hotels) would add a service layer with no payoff — and park-wide concerns like ticket
   sales and gate validation have no owning event to scope to. Guards are simply
   `@Roles(Role.Admin, Role.ParkStaff)`. **No `ParkAccessService` is needed.**
4. **Gate validation = reference lookup + QR display.** Staff type or paste a ticket reference
   into a search box; the system marks it `used`. Visitors see a rendered QR of that reference on
   their ticket. No camera API, no scanner dependency, nothing to fail during a live demo.

---

## 3. Schema change — `park_day_capacities`

The one new table. Everything else in the park domain already exists.

```
park_day_capacities
────────────────────────────────────────────────────────────
id          bigint     PK, increment
date        date       UNIQUE          -- the visit day being capped
capacity    int        -               -- max tickets sellable that day
is_closed   boolean    default false   -- park shut that day
note        text       nullable        -- e.g. "Private event", "Maintenance"
created_at  timestamp  -
updated_at  timestamp  -
```

**Drizzle:** `apps/backend/src/shared/database/schema/park-day-capacities.schema.ts`, stored as
`integer('date', { mode: 'timestamp' }).notNull().unique()` — matching `park_tickets.visitDate`.
Normalise every date to **UTC midnight** on write so the unique constraint and lookups behave.

**Capacity maths (application-enforced, like every other rule in this codebase):**

```
sold(date)      = SUM(park_tickets.quantity)
                  WHERE visit_date = date AND status != 'cancelled'

capacity(date)  = park_day_capacities.capacity        -- if a row exists
                  else PARK_DEFAULT_DAILY_CAPACITY    -- config fallback

remaining(date) = capacity(date) - sold(date)
```

**A missing row means "default capacity", not "closed".** Staff only create a row when they want
to override a specific day — cap it low, raise it for a festival, or close it entirely. This keeps
ops from having to seed a row for all 365 days of the year.

Add `PARK_DEFAULT_DAILY_CAPACITY` to `config/app.config.ts` + `config/env.validation.ts` (default
`2000`).

**Follow-through:** register in `schema/index.ts`, run `npm run db:generate` + `db:migrate`, and
**update [Db_Schema.md](Db_Schema.md)** — it's the declared source of truth and must stay in sync.

---

## 4. Backend

Nine modules, all under `apps/backend/src/modules/`, each following the established
**repository → service → controller** split with DTOs in `dto/`. Every one must be registered in
`app.module.ts` (the mistake the ferry module made).

### 4.1 `park-ticket-types` — priced catalog

`@Roles(Role.Admin, Role.ParkStaff)` · mirrors `room-types` almost exactly.

| Method | Path                    | Notes                                             |
| ------ | ----------------------- | ------------------------------------------------- |
| GET    | `/park-ticket-types`    |                                                   |
| GET    | `/park-ticket-types/:id`|                                                   |
| POST   | `/park-ticket-types`    | `price` validated `^\d+(\.\d{1,2})?$`             |
| PATCH  | `/park-ticket-types/:id`| Price changes never touch sold tickets (snapshot) |
| DELETE | `/park-ticket-types/:id`| **409** if any `park_tickets` reference it        |

### 4.2 `events` — rides, shows, beach events

`@Roles(Role.Admin, Role.ParkStaff)` · mirrors `hotels`.

| Method | Path          | Notes                                                         |
| ------ | ------------- | ------------------------------------------------------------- |
| GET    | `/events`     | Filters: `?eventType=`, `?locationType=`, `?isActive=`        |
| GET    | `/events/:id` | Includes schedule count                                        |
| POST   | `/events`     | `eventType: ride\|show\|beach_event`, `locationType: theme_park\|beach` |
| PATCH  | `/events/:id` |                                                                |
| DELETE | `/events/:id` | **409** if schedules exist — steer staff to `isActive: false` |

### 4.3 `event-schedules` — when an event runs, and how many seats

`@Roles(Role.Admin, Role.ParkStaff)` · mirrors `rooms` (child rows listed via a query param).

| Method | Path                     | Notes                                                        |
| ------ | ------------------------ | ------------------------------------------------------------ |
| GET    | `/event-schedules`       | `?eventId=&from=&to=`. Row shape includes **`booked`** and **`remaining`** — the capacity dashboard reads this |
| GET    | `/event-schedules/:id`   |                                                              |
| POST   | `/event-schedules`       | **400** if `startAt` is in the past                          |
| PATCH  | `/event-schedules/:id`   | **400** if new `capacity` < already-booked seats             |
| DELETE | `/event-schedules/:id`   | **409** if bookings exist                                    |

### 4.4 `park-tickets` — sales and gate check-in

The heart of the module. `@Roles(Role.Admin, Role.ParkStaff)` at class level, with bare `@Roles()`
overrides opening the two visitor routes to any authenticated user — exactly the trick
[hotel-bookings.controller.ts](../apps/backend/src/modules/hotel-bookings/hotel-bookings.controller.ts)
uses.

| Method | Path                            | Who      | Notes                                             |
| ------ | ------------------------------- | -------- | ------------------------------------------------- |
| GET    | `/park-tickets`                 | staff    | `?visitDate=&status=&channel=&q=` (`q` searches reference / buyer name / email) |
| GET    | `/park-tickets/:id`             | staff    |                                                   |
| POST   | `/park-tickets`                 | visitor  | Online purchase — `channel: 'online'`, `soldByUserId: null` |
| GET    | `/park-tickets/mine`            | visitor  | Own tickets, for "My Bookings" + QR               |
| POST   | `/park-tickets/gate-sale`       | staff    | Walk-up sale — see below                          |
| GET    | `/park-tickets/lookup/:reference` | staff  | Read-only preview before check-in (no mutation)   |
| POST   | `/park-tickets/validate`        | staff    | `{ ticketReference }` → marks `used`              |
| PATCH  | `/park-tickets/:id/status`      | staff    | `cancelled` / `refunded`                          |

**Purchase rules** (online and gate share one private `sellTicket()`):

- `visitDate` must not be in the past.
- The day must not be closed (`park_day_capacities.is_closed`).
- `sold(visitDate) + quantity <= capacity(visitDate)` → else **409 Conflict**.
- `totalAmount = (price × quantity).toFixed(2)` — a **snapshot**, stored as text. Never a float.
- Insert a mock `payments` row: `payable_type: 'park_ticket'`, `status: 'completed'`,
  `method: 'card'` (online) / `'cash'` (gate) — same mock-payment approach as
  `hotel-bookings.service.ts`.
- `ticketReference` = `PT-XXXXXXXX` (`randomUUID().slice(0,8).toUpperCase()`), matching the
  existing `HB-` convention.

**Gate sale needs a user, and `park_tickets.user_id` is `NOT NULL`.** A walk-up customer may have
no account. So the gate-sale service **finds-or-creates a visitor user** from the `{ name, email }`
on the form: look up by email; if absent, insert a `visitor` with a random unguessable
`password_hash` (they can do a password reset later to claim the account). Then set
`channel: 'gate'` and `soldByUserId: currentUser.id`. Do **not** attach gate tickets to the staff
member's own user id — that would corrupt every per-visitor report.

**Validation / check-in** (`POST /park-tickets/validate`) — reject with a *specific* reason, since
the whole point of the screen is telling the gate operator what's wrong:

| Condition                     | Response                                              |
| ----------------------------- | ----------------------------------------------------- |
| Reference not found           | **404** "No ticket with that reference"               |
| `status = 'used'`             | **409** "Already checked in at {time}"                |
| `status = 'cancelled'/'refunded'` | **409** "This ticket was {status}"                 |
| `visit_date != today`         | **409** "This ticket is valid for {date}, not today"  |
| Otherwise                     | **200** → set `status = 'used'`, return the ticket    |

### 4.5 `event-bookings` — ride / show / beach-event seats

`@Roles(Role.Admin, Role.ParkStaff)` with visitor overrides · mirrors `hotel-bookings`.

| Method | Path                        | Who     | Notes                                    |
| ------ | --------------------------- | ------- | ---------------------------------------- |
| GET    | `/event-bookings`           | staff   | `?eventId=&scheduleId=&status=`          |
| GET    | `/event-bookings/:id`       | staff   |                                          |
| POST   | `/event-bookings`           | visitor | Requires a park ticket — see below       |
| GET    | `/event-bookings/mine`      | visitor |                                          |
| PATCH  | `/event-bookings/:id/status`| staff   | `confirmed` / `cancelled`                |

**The cross-domain prerequisite** — the park's answer to "ferry needs a hotel booking". Enforce
*all four* checks; the FK alone only proves a ticket exists, not that it's the right one:

1. `parkTicketId` exists **and belongs to the calling user** (else 403 — otherwise anyone could
   pass a stranger's ticket id).
2. That ticket's `status = 'active'`.
3. The ticket's `visit_date` is the **same calendar day** as the schedule's `start_at` — a Monday
   ticket cannot get you into a Tuesday show.
4. `quantity <= parkTicket.quantity` — a 2-person ticket cannot book 5 event seats.

**Capacity:** `SUM(event_bookings.quantity WHERE status != 'cancelled') + quantity <=
event_schedules.capacity` → else **409**. Snapshot `totalAmount` from `events.base_price`, mock
payment with `payable_type: 'event_booking'`, reference `EB-XXXXXXXX`.

### 4.6 `park-days` — per-day ticket availability

`@Roles(Role.Admin, Role.ParkStaff)`.

| Method | Path              | Notes                                                              |
| ------ | ----------------- | ------------------------------------------------------------------ |
| GET    | `/park-days`      | `?from=&to=` → **merged calendar**: every day in range with `date, capacity, sold, remaining, isClosed, note, isDefault`. Days with no override row are synthesised from the config default |
| PUT    | `/park-days/:date`| **Upsert** `{ capacity, isClosed, note }`. **400** if `capacity < sold(date)` — you can't cap a day below what's already been sold |
| DELETE | `/park-days/:date`| Remove the override → day reverts to the default cap               |

### 4.7 `park-dashboard` — capacity monitoring

`@Roles(Role.Admin, Role.ParkStaff)` · `GET /park-dashboard`, one aggregate payload like
`hotel-dashboard`:

- **KPIs:** tickets sold today (split gate vs online) · revenue today · revenue last 30 days ·
  visitors checked in today (`status = 'used'`) · today's park fill (`sold / capacity`).
- **Capacity alerts** (the priority-actions equivalent): event schedules >90% full · upcoming days
  at or near their cap · closed days in the next 14 days.
- **Today's gate:** tickets for today, with checked-in vs not-yet-arrived counts.
- **Sales trend:** 30-day revenue series for the area chart.
- **Upcoming schedules:** next ~10 with fill percentage.

### 4.8 `park-reports` — ticket sales & visitors

`@Roles(Role.Admin, Role.ParkStaff)` · mirrors `hotel-reports`.

| Method | Path                    | Notes                                              |
| ------ | ----------------------- | -------------------------------------------------- |
| GET    | `/park-reports/sales`   | `?from=&to=&groupBy=day\|ticketType\|channel`      |
| GET    | `/park-reports/visitors`| Sold vs checked-in per day → **check-in rate**     |
| GET    | `/park-reports/events`  | Per-event: schedules run, seats sold, **fill rate**, revenue |

All revenue reads come from the `payments` table (`payable_type IN ('park_ticket',
'event_booking')`, `status = 'completed'`) — the single source of sales truth across every domain.

### 4.9 `public-park` — unauthenticated browsing

`@Public() @Roles()` · mirrors `public-hotels`. Powers the visitor pages before login.

| Method | Path                          | Notes                                          |
| ------ | ----------------------------- | ---------------------------------------------- |
| GET    | `/public/park/ticket-types`   | Ticket tiers + prices                          |
| GET    | `/public/park/events`         | `?eventType=&locationType=` — active only      |
| GET    | `/public/park/events/:id`     | Detail + upcoming schedules with `remaining`   |
| GET    | `/public/park/availability`   | `?from=&to=` → per-day `remaining` + `isClosed`, for the date picker |

**Never expose** buyer names, emails, or ticket references through `/public/*`.

### 4.10 Cross-cutting

**Audit actions** — extend
[audit-action.enum.ts](../apps/backend/src/shared/enums/audit-action.enum.ts):

```
ParkTicketTypeCreated/Updated/Deleted    park_ticket_type.*
EventCreated/Updated/Deleted             event.*
EventScheduleCreated/Updated/Deleted     event_schedule.*
ParkTicketSold                           park_ticket.sold
ParkTicketValidated                      park_ticket.validated
ParkTicketCancelled                      park_ticket.cancelled
EventBookingCreated/Cancelled            event_booking.*
ParkDayCapacityUpdated/Cleared           park_day_capacity.*
```

`park_ticket.validated` and `park_ticket.sold` matter most — they're the audit trail for money and
physical access.

**Promotions** ("Promotions for activities", requirement §4). Reuse the existing module — don't
build a second one. `promotion_targets.target_type` already accepts `'event'`. Two changes:

- Add `Role.ParkStaff` to `@Roles(Role.Admin, Role.HotelStaff)` in
  [promotions.controller.ts](../apps/backend/src/modules/promotions/promotions.controller.ts).
- Add a `?targetType=` filter so the park promotions page shows only event-targeted promos.

---

## 5. Frontend

Two feature folders, matching the existing split (`features/hotels` = staff,
`features/hotel-browsing` = visitor). Each carries `types.ts`, `server.ts` (TanStack
`createServerFn` + Zod validators), `queries.ts` (`queryOptions`), `constants.ts`, `components/`,
`pages/`.

- **`features/park/`** — staff.
- **`features/park-browsing/`** — visitor.

All API calls go through `apiFetch` from [server-api.ts](../apps/frontend/src/lib/server-api.ts),
which handles cookie forwarding and the 401-refresh-retry dance. Never call the API from the
browser directly.

The park accent colour token **already exists** — `bg-series-park` / `text-series-park` are used on
the current theme-park page. Use it for park charts and badges.

### 5.1 Staff routes — `/dashboard/park/*`

| Route                              | Page                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `dashboard/park/route.tsx`         | **Role guard — missing today, add first.** Copy [dashboard/hotel/route.tsx](../apps/frontend/src/routes/dashboard/hotel/route.tsx): redirect to `/login` if unauthenticated, to `landingPathForRole(role)` unless `admin` or `park_staff` |
| `dashboard/park/index.tsx`         | **Dashboard** — KPI cards, sales area chart, capacity alerts, today's gate |
| `dashboard/park/events/index.tsx`  | **Events** — CRUD table + expandable schedule rows (`booked/capacity` bar) |
| `dashboard/park/tickets/index.tsx` | **Ticket sales** — ticket-type catalog CRUD + sales table (filter by date/status/channel) |
| `dashboard/park/gate/index.tsx`    | **On-site** — big reference search box for check-in + walk-up gate-sale form |
| `dashboard/park/bookings/index.tsx`| **Event bookings** — manage ride/show/beach bookings, confirm/cancel     |
| `dashboard/park/availability/index.tsx` | **Availability calendar** — month grid; click a day to set cap / close it |
| `dashboard/park/reports/index.tsx` | **Reports** — sales over time, revenue by ticket type, online-vs-gate split, event fill-rate table |
| `dashboard/park/promotions/index.tsx` | **Promotions** — event-targeted promos (reuses `features/promotions`) |

**The gate page is the signature screen** and worth the extra polish — it's the one that visibly
answers "On-site ticket validation interface". Autofocused input, Enter to submit, large
unmistakable green-valid / red-invalid result card with the failure reason spelled out, and a
running list of the last ~10 check-ins this session.

**Reuse, don't rebuild:** `stat-card`, `revenue-over-time-chart` and `revenue-by-domain-chart`
(`features/reports/components`), `confirm-dialog`, `empty-state`, `booking-status-badge`,
`dashboard-skeleton`, and the `*-dialog.tsx` create/edit dialog pattern from `features/hotels`.

### 5.2 Visitor routes — `/theme-park/*`

| Route                             | Page                                                                        |
| --------------------------------- | --------------------------------------------------------------------------- |
| `theme-park/index.tsx`            | **Replace the "coming soon" page.** Real ticket tiers from the API + event browsing |
| `theme-park/tickets.tsx`          | **Buy a park ticket** — date picker (days at capacity/closed disabled, fed by `/public/park/availability`), ticket type, quantity, live price |
| `theme-park/events/$eventId.tsx`  | **Event detail** — schedules with remaining seats; booking gated on owning a valid ticket for that day |
| `theme-park/confirmation.tsx`     | **Confirmation** — reference + QR, mirroring the hotel confirmation page     |

**Extend `my-bookings`** to show park tickets and event bookings alongside hotel bookings, each
ticket rendering its **QR code** of the `ticketReference` — that QR is what §4's gate page reads.

### 5.3 Navigation

Fill in the `park_staff` group in
[app-shared.tsx](../apps/frontend/src/components/app-shared.tsx) — every path is a dead `#/`
placeholder today:

```
Theme Park  → Dashboard  /dashboard/park/           LayoutGridIcon
              Events     /dashboard/park/events     FerrisWheelIcon
              Tickets    /dashboard/park/tickets    TicketIcon
              Gate       /dashboard/park/gate       ScanLineIcon
              Bookings   /dashboard/park/bookings   CalendarCheckIcon
Capacity    → Availability /dashboard/park/availability  CalendarClockIcon
Insights    → Reports    /dashboard/park/reports    BarChart3Icon
              Promotions /dashboard/park/promotions PercentIcon
```

Also point the admin group's `Theme Park` item (currently `#/park`) at `/dashboard/park/`.
`landingPathForRole` already sends `park_staff` → `/dashboard/park`, so no change needed there.

---

## 6. Seeds

Extend [seeds/demo.ts](../apps/backend/src/shared/database/seeds/demo.ts) — the park staff user
(`park@example.com`), ticket types, events, schedules and bookings already exist. Add:

- **`park_day_capacities` rows** — a normal day, a near-capacity day (to trigger the dashboard
  alert), and one closed day. Without these the availability calendar and alerts demo as empty.
- **A mix of ticket statuses** — some `used` (so the check-in rate report isn't 0%), some
  `cancelled`.
- **Gate-channel tickets** with `soldByUserId` set, so the online-vs-gate split renders.
- **A near-full event schedule** (>90%) to light up the capacity alert.

Seed data is what the module gets marked on — an empty dashboard demos as broken.

---

## 7. Build order

Each phase leaves the app in a working state.

| Phase | Work                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- |
| **0** | `park_day_capacities` schema + migration + `PARK_DEFAULT_DAILY_CAPACITY` config + **update Db_Schema.md** |
| **1** | Backend catalog: `park-ticket-types`, `events`, `event-schedules`, `park-days`. Register all in `app.module.ts` |
| **2** | Backend sales: `park-tickets` (online, gate-sale, validate) + `event-bookings`. **All the business rules in §4.4/§4.5 live here — this is the phase that matters** |
| **3** | Backend `park-dashboard`, `park-reports`, `public-park`; audit actions; promotions role update |
| **4** | Frontend: `dashboard/park/route.tsx` guard, `features/park` scaffold (types/server/queries), sidebar nav |
| **5** | Frontend staff pages: dashboard → events → tickets → **gate** → bookings → availability → reports |
| **6** | Frontend visitor flow: `features/park-browsing`, `/theme-park/*` rebuild, QR in `my-bookings` |
| **7** | Seeds, unit tests, polish                                                                 |

**Tests.** The existing precedent is service-level unit tests (`promotions.service.spec.ts`,
`reports.service.spec.ts`, `users.service.spec.ts`). Cover the rules a DB constraint can't:

- Day capacity: selling past the cap → 409; selling on a closed day → 409.
- Event booking: park ticket owned by another user → 403; ticket for the wrong day → 400;
  `quantity` > ticket quantity → 400; overbooking a schedule → 409.
- Validation: already-used, cancelled, and wrong-day tickets each rejected with their own message.
- Money: `totalAmount` is a snapshot — changing a ticket type's price must not alter tickets
  already sold.

---

## 8. Notes / out of scope

- **The ferry module is broken** and it isn't this plan's job to fix it — but it should be logged:
  `FerryModule` is absent from `app.module.ts` (every ferry route 404s), the controller has no
  `@Roles()` guard, and there is no hotel-booking-prerequisite check despite that being ferry's
  headline requirement. The frontend ferry pages render mock arrays. Worth a separate ticket.
- **CLAUDE.md is stale** — it claims `src/shared/database/` is unbuilt and Drizzle isn't
  installed. Both are long since false. Worth refreshing.
- **`user_assignments.assignable_type` keeps its `'event'` value** even though decision §2.3 means
  nothing writes it yet. It costs nothing and leaves the door open for per-event staff scoping.
- **Payments are mocked** throughout, consistent with the hotel domain. No processor is integrated.
