# Theme Park — Completion Plan (Visitor Flow & Remaining Gaps)

Closes the gaps between what [parkManagement.md](parkManagement.md) planned and what actually
shipped. Covers requirement §1 (Visitor — the park half) and the two unfinished lines of §4
(Theme Park Management / Ticketing Staff) from [requirements.md](requirements.md).

**This is a frontend plan.** The backend is ~95% done; six built endpoints have no caller.

---

## 1. Where we're starting from

An audit of the park module against [requirements.md](requirements.md) found the staff module
delivered and the visitor module absent. [parkManagement.md](parkManagement.md) §7 laid out eight
build phases; **phases 0–5 landed, phase 6 never did.**

### What works

| Requirement §4                          | Status                                              |
| --------------------------------------- | --------------------------------------------------- |
| Create and manage event schedules       | ✅ Full CRUD, staff UI                              |
| Manage tickets and capacity limits      | ✅ Ticket types, per-schedule, per-day              |
| Manage availability for specific days   | ✅ Calendar at `/dashboard/park/availability`       |
| Track ticket sales                      | ✅ Sales table, dashboard KPIs, reports             |
| Manage inside-park activities and events| ✅                                                  |
| Capacity monitoring dashboard           | ✅                                                  |
| On-site ticket validation interface     | ✅ The gate page is the module's strongest screen   |
| Promotions for activities               | ✅ Reuses `features/promotions`, scoped to `event`  |
| Reports on ticket sales and visitors    | ✅ Sales / visitors / event performance             |

### What doesn't

| Gap                                          | Backend | Frontend | Requirement            |
| -------------------------------------------- | ------- | -------- | ---------------------- |
| Visitor buys a park ticket online            | ✅ `POST /park-tickets` | ❌ | §1, and §4 _"online and at entrance"_ |
| Visitor books a ride / show                  | ✅ `POST /event-bookings` | ❌ | §1 "Activity and event booking screens" |
| Visitor books a beach event                  | ✅ (`locationType=beach` filter) | ❌ | §1 "Beach events booking interface" |
| Visitor browses park dates & events          | ✅ `GET /public/park/*` (4 routes) | ❌ | §1 "showing available dates and events" |
| Park confirmation screen                     | ✅ (reference returned) | ❌ | §1 "Confirmation and payment screens" |
| Visitor sees own tickets/bookings            | ✅ `/park-tickets/mine`, `/event-bookings/mine` | ❌ | §1 |
| Staff books an activity for a walk-up guest  | ❌ | ❌ | §4 "Handle bookings for rides, shows, beach events" |

**The single largest artefact of the gap:**
[routes/theme-park/index.tsx](../apps/frontend/src/routes/theme-park/index.tsx) is still the
"coming soon" marketing page [parkManagement.md](parkManagement.md) §5.2 said to replace — a
hardcoded `TICKET_TIERS` array and a fake email capture form. `SiteHeader` points **both** its
"Theme Park" and "Beach Events" links at it.

Two homepage sections are also mock arrays:
[upcoming-events.tsx](../apps/frontend/src/features/hotel-browsing/components/upcoming-events.tsx)
(its own comment reads _"Mock schedule for now"_) and
[theme-park-experiences.tsx](../apps/frontend/src/features/hotel-browsing/components/theme-park-experiences.tsx).

### The reference implementation

`features/hotel-browsing/` is the visitor-side vertical slice to mirror, exactly as
`features/hotels` was mirrored for staff. It already solves every problem this plan faces:

| hotel-browsing                     | park-browsing equivalent                    |
| ---------------------------------- | ------------------------------------------- |
| `hotels-browse-page.tsx`           | Event browsing (rides / shows / beach)      |
| `hotel-detail-page.tsx`            | Event detail + schedule picker              |
| `hotel-book-page.tsx` (3-step)     | Ticket purchase, and event booking          |
| `hotel-booking-confirmation-page`  | Ticket / booking confirmation + QR          |
| `availability-calendar.tsx`        | Park day picker (sold-out / closed days)    |
| `booking-summary-panel.tsx`        | Price summary                               |
| `inline-auth-panel.tsx`            | Sign-in during checkout — **reuse as-is**   |

---

## 2. Decisions taken

1. **New feature folder `features/park-browsing/`.** Matches the existing staff/visitor split
   (`features/hotels` ↔ `features/hotel-browsing`). Do not extend `features/park` — that is the
   staff module and its `server.ts` calls authenticated staff routes.

2. **The ticket-then-event ordering is the central UX problem, not a technical one.**
   `event_bookings.park_ticket_id` is `NOT NULL`, and the service enforces four checks
   ([parkManagement.md](parkManagement.md) §4.5): the ticket must be owned by the caller, `active`,
   for the **same calendar day** as the schedule, and cover the seat count. A visitor who lands on
   "Fireworks Show" and hits Book will fail all four. **The UI must sell the park ticket first and
   make the dependency visible**, rather than surfacing a 403 after the fact. See §4.4.

3. **Beach events are a filter, not a separate page tree.** Requirement §1 lists "beach events"
   separately from "activities inside the theme park", but they are one `events` table
   discriminated by `locationType`. Ship one browse route and link to it pre-filtered
   (`/theme-park/events?locationType=beach`). Two page trees over one dataset is duplicated code
   that will drift.

4. **Reuse the hotel 3-step checkout shell** (`step` state → summary panel → `InlineAuthPanel` →
   mock payment method). Payments are mocked repo-wide; the park must not invent a second
   checkout idiom.

5. **Add `qrcode.react` for ticket QR codes.** [parkManagement.md](parkManagement.md) §5.2 promised
   a rendered QR of `ticketReference`; no QR library is installed. `qrcode.react` is dependency-free,
   renders SSR-safe SVG, and is ~10 kB. _Alternative:_ display the reference as large monospace
   text — the gate page is manual entry, so nothing functionally depends on the QR. **Recommend
   adding it**: it costs one dependency and visibly answers "on-site validation" in the demo.

6. **Staff-assisted event booking gets its own endpoint, not a flag.** See §3. Reusing
   `POST /event-bookings` with an optional `userId` would mean threading "is this the caller's
   ticket, or a ticket the caller is holding on someone's behalf?" through the prerequisite checks
   — the exact branching that makes authorisation bugs. A separate route keeps both rule sets
   readable.

7. **No `soldByUserId` column on `event_bookings`.** `park_tickets` has one because tickets have a
   genuine `channel` (online vs gate). Event bookings have no such split, and a column that is
   `NULL` on every visitor row invites the question at marking. Record the acting staff member in
   `audit_logs.metadata` instead — the audit trail already exists for exactly this.
   _Tradeoff:_ per-staff event-booking reporting would need an audit-log join rather than a
   `GROUP BY`. Acceptable; no requirement asks for it.

8. **No promo-code entry at checkout.** `CreateHotelBookingDto` has no `promoCode` either —
   promotions are catalog/display-only across the whole app. Adding park-only promo redemption
   would make the park inconsistent with hotel. Out of scope; noted in §8.

---

## 3. Backend — one endpoint

Everything else the visitor flow needs already exists and is verified:

```
GET  /public/park/ticket-types          → PublicTicketType[]      { id, name, price }
GET  /public/park/events                → PublicEvent[]           ?eventType= &locationType=
GET  /public/park/events/:id            → PublicEventDetail       + schedules[] with `remaining`
GET  /public/park/availability          → PublicDayAvailability[] { date, remaining, isClosed }
POST /park-tickets            (visitor)  ← CreateParkTicketDto    { ticketTypeId, visitDate, quantity }
GET  /park-tickets/mine       (visitor)
POST /event-bookings          (visitor)  ← CreateEventBookingDto  { eventScheduleId, parkTicketId, quantity }
GET  /event-bookings/mine     (visitor)
```

### 3.1 `POST /event-bookings/staff` — walk-up activity booking

Closes §4 _"Handle bookings for rides, shows, and beach events"_. Staff can currently only view and
change the status of bookings; they cannot create one. A guest at the desk holding a valid park
ticket must be bookable onto a show.

`@Roles(Role.Admin, Role.ParkStaff)` — the class-level guard, no bare `@Roles()` override.

**DTO** — `dto/staff-event-booking.dto.ts`:

```ts
{
  ticketReference: string;   // what the guest physically hands over, not an id
  eventScheduleId: number;
  quantity: number;          // 1..50
}
```

Taking a **reference** rather than a `parkTicketId` matches the gate page's mental model — staff
read what is printed on the ticket. Resolve it via the existing repository lookup.

**Rules** — three of the four visitor checks carry over unchanged; only ownership differs:

| Check                                                   | Visitor            | Staff                                    |
| ------------------------------------------------------- | ------------------ | ---------------------------------------- |
| Ticket belongs to the caller                            | **403** if not     | **Skipped** — staff holds the ticket     |
| Ticket `status = 'active'`                              | ✅ same            | ✅ same                                  |
| Ticket `visit_date` = schedule's `start_at` calendar day| ✅ same            | ✅ same                                  |
| `quantity <= parkTicket.quantity`                       | ✅ same            | ✅ same                                  |
| Schedule capacity not exceeded                          | ✅ same → 409      | ✅ same → 409                            |

**Attach the booking to `parkTicket.userId`, never to the staff member's id.** This is the same
trap [parkManagement.md](parkManagement.md) §4.4 calls out for gate sales — getting it wrong
corrupts every per-visitor report and puts staff accounts in customer-facing booking lists.

Reuse the existing private `createBooking()` path so the payment row (`payable_type:
'event_booking'`, `method: 'cash'` for a desk sale) and the `EB-XXXXXXXX` reference are generated
identically.

**Audit:** `EventBookingCreated` with `metadata: { soldByUserId: currentUser.id, channel: 'desk' }`.

**Tests** (`event-bookings.service.spec.ts`, extending the existing suite):
unknown reference → 404 · cancelled/used ticket → 409 · schedule on a different day to the ticket →
400 · `quantity` above the ticket's → 400 · overbooked schedule → 409 · **booking is attributed to
the ticket owner, not the acting staff member**.

---

## 4. Frontend — visitor flow

New folder `features/park-browsing/`, carrying `types.ts`, `server.ts`, `queries.ts`,
`constants.ts`, `components/`, `pages/` — the same shape as every other feature folder.

All API calls go through `apiFetch` from
[server-api.ts](../apps/frontend/src/lib/server-api.ts) (cookie forwarding + 401-refresh-retry).
Never call the API from the browser. Park accent tokens `bg-series-park` / `text-series-park`
already exist — use them for park badges and charts.

### 4.1 `server.ts`

Mirror [hotel-browsing/server.ts](../apps/frontend/src/features/hotel-browsing/server.ts) —
`createServerFn` + Zod validator + `apiFetch` + `errorMessage`.

```
getPublicParkTicketTypesServerFn   GET  /public/park/ticket-types
getPublicParkEventsServerFn        GET  /public/park/events?eventType&locationType
getPublicParkEventServerFn         GET  /public/park/events/:id
getParkAvailabilityServerFn        GET  /public/park/availability?from&to
purchaseParkTicketServerFn         POST /park-tickets
createEventBookingServerFn         POST /event-bookings
getMyParkTicketsServerFn           GET  /park-tickets/mine
getMyEventBookingsServerFn         GET  /event-bookings/mine
```

### 4.2 `queries.ts`

`queryOptions` for the reads (`staleTime: 30 * 1000`, matching hotel), `mutationOptions` for the two
writes. Query keys: `["public-park", ...]`, `["my-park-tickets"]`, `["my-event-bookings"]`.

Availability is the one to get right — key it by range so the date picker doesn't refetch on every
month flip: `["public-park", "availability", from, to]`.

### 4.3 Routes

| Route                              | Page                            | Auth                        |
| ---------------------------------- | ------------------------------- | --------------------------- |
| `theme-park/index.tsx`             | **Replace the stub.** Real ticket tiers from the API, featured events, two CTAs (Buy tickets / Browse events) | public |
| `theme-park/tickets.tsx`           | Buy a park ticket — 3-step checkout | public to browse, auth to pay |
| `theme-park/events/index.tsx`      | Browse events. `validateSearch` on `?eventType=&locationType=` | public |
| `theme-park/events/$eventId.tsx`   | Event detail + schedule picker + booking | public to browse, auth to book |
| `theme-park/confirmation.tsx`      | `?ref=` → confirmation + QR     | auth (`beforeLoad` redirect) |

**One confirmation route serves both purchases.** `PT-` and `EB-` reference prefixes already
disambiguate ticket from event booking; the page loads both `mine` queries and renders whichever
matches. Copy the `beforeLoad` redirect-to-login guard from
[hotels/$hotelId/confirmation.tsx](../apps/frontend/src/routes/hotels/$hotelId/confirmation.tsx).

### 4.4 The prerequisite, made visible

The rule to design around: **a park ticket for date D admits you to events on date D only.**

**Ticket purchase** (`/theme-park/tickets`) — three steps, mirroring hotel:

1. **Date & tickets** — day picker driven by `/public/park/availability`. Days where
   `isClosed` or `remaining === 0` are **disabled with a reason**, not silently unselectable.
   Ticket type radio cards + quantity stepper; live total from `price × quantity`.
2. **Contact** — prefilled for signed-in users; `InlineAuthPanel` for guests.
3. **Payment** — mock method selection, same component set as hotel.

On success, navigate to `/theme-park/confirmation?ref=PT-XXXXXXXX`. The confirmation must offer
**"Now book rides & shows for {visitDate}"**, deep-linking to
`/theme-park/events?date={visitDate}` — this is the moment the visitor is most likely to add events,
and it teaches the ordering without a word of explanation.

**Event booking** (`/theme-park/events/$eventId`) — schedules listed with `remaining` seats. The
CTA is state-dependent, resolved by matching `/park-tickets/mine` against the schedule's date:

| Visitor state                                        | CTA                                                       |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Signed out                                           | "Sign in to book" → `InlineAuthPanel`                     |
| No active ticket for that date                       | **"Buy a park ticket for {date} first"** → `/theme-park/tickets?date=…` — the primary action, with a one-line note that park entry is required |
| Has a ticket, seats remaining on it                  | Quantity stepper + "Book seats", ticket auto-selected     |
| Has multiple tickets for that date                   | Ticket selector, then as above                            |
| Ticket quantity already fully committed              | Disabled + "Your ticket covers {n} guests"                |

Never render an enabled Book button that the backend will reject. A `ticket-prerequisite-notice.tsx`
component owns this logic so the page body stays readable.

### 4.5 Components

`components/`:

- `park-ticket-type-card.tsx` — tier name, price, selected state
- `park-date-picker.tsx` — `react-day-picker` (already a dependency) with disabled/sold-out days
- `event-card.tsx` — browse grid card, type badge (`ride` / `show` / `beach_event`)
- `event-schedule-picker.tsx` — time slots with `remaining` seats
- `ticket-prerequisite-notice.tsx` — the §4.4 state machine
- `park-ticket-qr.tsx` — QR of `ticketReference` + the reference in monospace beneath it
- `event-type-badge.tsx` — shared with `my-bookings`

**Reuse rather than rebuild:** `InlineAuthPanel`, `BookingSummaryPanel`, `PaymentTrustBadges`,
`empty-state`, `confirm-dialog`, and the `booking-status-badge` from the staff feature.

### 4.6 `my-bookings`

[my-bookings-page.tsx](../apps/frontend/src/features/hotel-browsing/pages/my-bookings-page.tsx)
currently loads hotel bookings only. Wrap its existing content in an **outer `Tabs`**:

```
Hotels  |  Park tickets  |  Activities
```

The inner upcoming/completed/cancelled tabs stay untouched inside the Hotels panel. Park tickets
render via `park-ticket-qr.tsx` — that QR is what the gate page reads, closing the loop between
requirement §1 and §4.

Add both `mine` queries to the route loader in
[my-bookings/index.tsx](../apps/frontend/src/routes/my-bookings/index.tsx).

_Note:_ this leaves a cross-domain page living in `features/hotel-browsing/`. Moving it to a new
`features/bookings/` is tidier but churns imports for no marks — **leave it, and mention the smell
in the report's "future work" section** rather than paying for it now.

### 4.7 Homepage — replace the mock arrays

Both sections sit on the visitor homepage and currently render invented content:

- **`upcoming-events.tsx`** → `/public/park/events`, take the next 3 by schedule date. Its own
  comment already flags it as mock.
- **`theme-park-experiences.tsx`** → `/public/park/events?eventType=ride`. `events` has no images;
  `imageables.imageable_type` is free text so event images are possible without a migration, but
  no upload UI exists for them. **Keep the existing local images as a name-keyed fallback map** and
  treat event image upload as out of scope (§8).

Cheap, high-visibility, and it removes two "why is this hardcoded?" findings from the demo.

### 4.8 Navigation

[SiteHeader.tsx](../apps/frontend/src/components/SiteHeader.tsx) — both park links currently point
at the stub:

```
Theme Park    → /theme-park
Beach Events  → /theme-park/events?locationType=beach
Buy Tickets   → /theme-park/tickets          (new — the money path deserves a top-level link)
```

Check [SiteFooter.tsx](../apps/frontend/src/components/SiteFooter.tsx) for the same.

---

## 5. Frontend — staff gap

`/dashboard/park/bookings` gets a **"New booking"** button opening
`components/manual-booking-dialog.tsx`:

1. Ticket reference input → on blur, `GET /park-tickets/lookup/:reference` shows buyer name, visit
   date and quantity, so staff can confirm they have the right guest before going further.
2. Schedule select, filtered to the ticket's visit date — the day rule enforced in the UI, not
   discovered as a 400.
3. Quantity stepper, capped at the ticket's quantity.
4. Submit → `POST /event-bookings/staff`, invalidate `["event-bookings"]`.

A dialog, not a page: hotel's manual booking needed a full page because it spans room types, dates
and guest details; this is three fields. Follow the `*-dialog.tsx` pattern already in
`features/park/components/`.

---

## 6. Seeds

Extend [seeds/demo.ts](../apps/backend/src/shared/database/seeds/demo.ts). The visitor flow demos
as broken without these:

- **Active park tickets owned by the demo visitor account**, dated **today and the next few days**
  — otherwise every event page shows "buy a ticket first" and the booking path can't be shown.
- **Event schedules in the near future** with varied `remaining` — one nearly full, one with plenty.
  Past-dated schedules don't appear in `/public/park/events/:id` (it returns upcoming only).
- **At least one `beach_event`** with upcoming schedules, so the Beach Events link isn't empty.
- **A confirmed event booking** for the demo visitor, so the Activities tab in `my-bookings` has
  content.

Seeds are what the module is marked on. Re-check them after any date-sensitive change — demo data
dated relative to a fixed past date silently rots.

---

## 7. Build order

Each phase leaves the app working and demonstrable.

| Phase | Work                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------- |
| **0** | `features/park-browsing/` scaffold — `types.ts`, `server.ts`, `queries.ts`, `constants.ts`. No UI. Verify each server fn against the running API |
| **1** | **Ticket purchase** — `/theme-park` rebuild + `/theme-park/tickets` + `/theme-park/confirmation`. Closes §4 _"sell online"_, the single biggest gap |
| **2** | **`my-bookings` tabs** + QR (`qrcode.react`). Cheap, and it completes the buy → hold → validate loop with the existing gate page |
| **3** | **Event browsing & booking** — `/theme-park/events`, `/theme-park/events/$eventId`, the §4.4 prerequisite states. Beach events fall out of the `locationType` filter |
| **4** | **Staff manual booking** — `POST /event-bookings/staff` + service tests + the dialog |
| **5** | Homepage mock replacement, header/footer nav, seeds |
| **6** | Polish: loading skeletons, empty states, error toasts, mobile checkout |

Phases 1 and 3 are each independently demonstrable. If time runs short, **phase 1 + 2 alone** turns
"backend complete, frontend absent" into a working end-to-end sale, and is worth more than a partial
attempt at everything.

---

## 8. Notes / out of scope

- **Promo codes at checkout** — no domain applies them at purchase (`CreateHotelBookingDto` has no
  `promoCode`). Promotions are catalog-only app-wide. Adding park-only redemption would make the
  park inconsistent with hotel; leave it.
- **Event images** — `imageables.imageable_type` is free text so no migration is needed, but there
  is no upload UI for events and no seed images. Homepage falls back to the existing local images.
- **Real payments** remain mocked throughout, consistent with hotel and ferry.
- **`my-bookings-page.tsx` lives in `features/hotel-browsing/`** while serving three domains after
  this plan. Known smell, deliberately not paid down — see §4.6.
- **Ferry is still broken** and unrelated to this plan:
  [parkManagement.md](parkManagement.md) §8 logged it, and the audit confirms the frontend ferry
  pages still render mock arrays. Separate ticket.
- **CLAUDE.md is stale** — it still claims `src/shared/database/` is unbuilt and Drizzle isn't
  installed. Both have been false for a long time.
