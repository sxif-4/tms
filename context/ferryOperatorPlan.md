# Ferry Operator / Ferry Staff — Gap Closure Plan

Covers requirement §3 (Ferry Operator / Ferry Staff) from [requirements.md](requirements.md),
plus the visitor-facing ferry purchase flow that feeds the operator's queue (§1, "Purchase ferry
tickets (only if a valid hotel booking exists)").

Unlike [parkManagement.md](parkManagement.md), this is **not** a greenfield plan. The ferry module
exists and works; this document closes the nine gaps found in the audit of it against the spec.

---

## 1. Where we're starting from

**Backend — a working but thin CRUD module.** `modules/ferry/` has the standard
repository → service → controller split, DTOs for routes and schedules, and is registered in
[app.module.ts](../apps/backend/src/app.module.ts).

> Note: [parkManagement.md](parkManagement.md) §1 claims the ferry module "isn't even registered in
> app.module.ts, so its routes are dead". That line is **stale** — `FerryModule` is registered.
> The rest of its warning (no capacity checks, no audit logging, mock frontend) still stands.

What is genuinely correct today and must be preserved:

- The hotel-booking prerequisite is structural, not decorative —
  [ferry-bookings.schema.ts:19-21](../apps/backend/src/shared/database/schema/ferry-bookings.schema.ts)
  makes `hotel_booking_id` `NOT NULL` with an FK.
- `total_amount` is snapshotted at booking time as a decimal string, never a float.
- The hotel-booking picker is server-driven and scoped per guest
  ([ferry.repository.ts:130-147](../apps/backend/src/modules/ferry/ferry.repository.ts)).
- Read routes (`GET /ferry/routes`, `/ferry/schedules`) carry `@Roles()` (empty = any authenticated
  user); every write inherits `@Roles(Role.Admin, Role.FerryStaff)` from the controller.

**Frontend — four pages, one of them entirely fake.**
`features/ferry/` has dashboard / routes / schedules / bookings pages. Routes, schedules and
bookings are live against the API but create-only. The dashboard is 100% hardcoded arrays.
There is **no `routes/dashboard/ferry/route.tsx`** — hotel, park and admin all have a layout role
guard; ferry does not.

**The reference implementations to copy.** Two verticals are fully realised. Follow them:

| Concern                | Copy from                                   |
| ---------------------- | ------------------------------------------- |
| Gate/boarding check-in | `park-tickets` — `lookup` + `validate`      |
| Booking lifecycle      | `hotel-bookings` — `mine`/`manual`/`cancel` |
| Aggregate KPI payload  | `park-dashboard`                            |
| Aggregate reporting    | `park-reports`                              |
| Frontend role guard    | `routes/dashboard/park/route.tsx`           |

---

## 2. The nine gaps, and where each is closed

| #   | Gap                                                        | Closed in       |
| --- | ---------------------------------------------------------- | --------------- |
| 1   | No validate action; `validatedBy` client-supplied          | §5.2, §6.3      |
| 2   | "Valid hotel booking" under-defined (owner, status, dates)  | §5.1            |
| 3   | No ferry pass issuance                                     | §5.2, §6.3      |
| 4   | No passenger list / trip reports                           | §5.4, §5.5, §6.5, §6.6 |
| 5   | Ferry dashboard is mock data                               | §5.3, §6.2      |
| 6   | Booking rows carry no guest/hotel detail; search is blind  | §5.3, §6.3      |
| 7   | Capacity counts cancelled bookings                         | §5.1            |
| 8   | Routes/schedules are create-only in the UI                 | §6.4            |
| 9   | `PATCH /ferry/bookings/:id` bypasses validation            | §5.2            |
| +   | Visitor cannot request a ferry ticket at all               | §7              |

---

## 3. Decisions taken

1. **No database schema changes. No migration. No `Db_Schema.md` edit.**
   Everything needed already exists: `validated_by` / `validated_at` / `status='validated'` on
   `ferry_bookings`, the polymorphic `payments` table (`payable_type='ferry_booking'`), and
   `audit_logs`. This keeps the whole plan zero-migration, which matters for a five-person group
   project where `db:generate` + `db:migrate` has to be coordinated.

2. **Issuance is attributed via `audit_logs`, not new columns.**
   Splitting "issue the pass" from "validate at the jetty" would naturally want
   `issued_by` / `issued_at` alongside `validated_by` / `validated_at`. We deliberately do not add
   them — the issuance event is recorded as an `audit_logs` row
   (`subject_type='FerryBooking'`, `action='ferry_booking.issued'`), which is exactly the pattern
   the codebase already uses. **Tradeoff:** the printed pass shows `updatedAt` as its issue time
   rather than a dedicated column. Accepted; if the group later wants it on the pass, add the two
   columns as a standalone migration.

3. **A four-state booking lifecycle, mapping 1:1 to the spec's three feature bullets.**

   ```
   pending ──issue──▶ confirmed ──validate──▶ validated
      │                   │
      └──── cancel ───────┴──▶ cancelled
   ```

   | State       | Meaning                                              | Spec bullet                    |
   | ----------- | ---------------------------------------------------- | ------------------------------ |
   | `pending`   | Requested; eligibility checked at creation           | "Validate ferry ticket requests" |
   | `confirmed` | Staff issued the pass; payment recorded              | "Provide customer with a ferry pass" |
   | `validated` | Passenger boarded; checked in at the jetty           | "Ticket validation interface"  |
   | `cancelled` | Withdrawn by guest or staff                          | —                              |

   Staff therefore get **two distinct actions**, not one vague "Review" button: **Issue pass**
   (`pending → confirmed`) and **Board / validate** (`confirmed → validated`).

4. **Role-only RBAC, no `user_assignments` scoping.**
   `user_assignments.assignable_type` includes `'ferry_route'`, but
   [user-assignments.service.ts:20](../apps/backend/src/modules/users/user-assignments.service.ts)
   already documents the decision that ferry staff are authorised by role alone. We keep that.
   There is one ferry operator running one network; a `FerryAccessService` mirroring
   `HotelAccessService` would be a service layer with no payoff. Guards stay
   `@Roles(Role.Admin, Role.FerryStaff)`.

5. **Validation is by booking reference, typed or pasted.**
   Same as the park gate: no camera API, no scanner dependency, nothing to fail during a live demo.
   The visitor's pass renders the reference as a QR; the operator types or pastes it.

6. **A cancelled sailing does not auto-cancel its bookings.**
   Cancelling a `ferry_schedules` row sets its status only. Affected bookings are surfaced on the
   schedule's manifest with a "sailing cancelled" banner so staff rebook deliberately. Silent mass
   cancellation would destroy the price snapshots and the audit trail.

---

## 4. Shared helpers

`toDateKey()` and `isSameUtcDay()` already exist in
[shared/utils/park-date.ts](../apps/backend/src/shared/utils/park-date.ts) and are exactly what the
ferry date rules need. **Import and reuse them as-is.** The file name is no longer accurate — if
anyone wants to rename it to `date-keys.ts`, do it as its own mechanical commit, not inside this
work.

`toDateKey` returns `YYYY-MM-DD`, so date-window comparisons can be plain lexicographic string
comparisons. Every rule below relies on that.

---

## 5. Backend — hardening the existing module

All paths under `apps/backend/src/modules/ferry/`.

### 5.1 `ferry.service.ts` — make the rules real (gaps 2, 7)

Add one shared eligibility guard, called from **every** path that creates, issues, or validates a
booking. Today the check is duplicated and weak in `createBooking` and `updateBooking`.

```ts
/** A stay only authorises ferry travel once it is actually paid for. */
const FERRY_ELIGIBLE_HOTEL_STATUSES = ['confirmed', 'completed'] as const;

/** Guests sail in the evening before check-in and the morning after check-out. */
const FERRY_TRAVEL_GRACE_DAYS = 1;

/**
 * The spec's "valid hotel booking" rule, in one place. Every rejection names its
 * own reason — staff need to know what to tell the guest at the counter.
 */
private assertHotelBookingEligible(
  hotelBooking: HotelBooking,
  passengerUserId: number,
  departureAt: Date,
): void {
  if (hotelBooking.userId !== passengerUserId) {
    throw new BadRequestException(
      'That hotel booking belongs to a different guest',
    );
  }
  if (!FERRY_ELIGIBLE_HOTEL_STATUSES.includes(hotelBooking.status)) {
    throw new BadRequestException(
      `Hotel booking is ${hotelBooking.status} — a confirmed stay is required for ferry access`,
    );
  }

  const from = addUtcDays(hotelBooking.checkIn, -FERRY_TRAVEL_GRACE_DAYS);
  const to = addUtcDays(hotelBooking.checkOut, FERRY_TRAVEL_GRACE_DAYS);
  const sailing = toDateKey(departureAt);

  if (sailing < toDateKey(from) || sailing > toDateKey(to)) {
    throw new BadRequestException(
      `Sailing on ${sailing} falls outside the stay ` +
        `(${toDateKey(hotelBooking.checkIn)} – ${toDateKey(hotelBooking.checkOut)})`,
    );
  }
}
```

This closes all three holes in gap 2 at once: **ownership**, **status**, and **date window**.

Add a second guard for the sailing itself — nothing currently stops a booking onto a departed,
cancelled, or past sailing:

```ts
private assertScheduleBookable(schedule: FerrySchedule): void {
  if (schedule.status !== 'scheduled') {
    throw new BadRequestException(`This sailing is ${schedule.status}`);
  }
  if (schedule.departureAt.getTime() <= Date.now()) {
    throw new BadRequestException('This sailing has already departed');
  }
}
```

**Capacity (gap 7).** Replace the `findBookingsByScheduleId(...)` + `reduce` pattern in both
`createBooking` and `updateBooking` with a single repository aggregate that excludes cancelled rows.
Cancelling a booking must free the seat:

```ts
// ferry.repository.ts
sumPassengersByScheduleId(scheduleId: number, excludeBookingId?: number): Promise<number>
//   SELECT COALESCE(SUM(passenger_count), 0) FROM ferry_bookings
//   WHERE schedule_id = ? AND status != 'cancelled' AND (? IS NULL OR id != ?)
```

Delete the now-unused `findBookingsByScheduleId`. Also drop the redundant
`dto.passengerCount > schedule.capacity` pre-check — the remaining-seats check subsumes it, and
having two error messages for one condition just confuses the operator.

`listHotelBookingsForUser` should also stop returning ineligible options: filter on
`FERRY_ELIGIBLE_HOTEL_STATUSES` rather than merely excluding `cancelled`, so the picker cannot
offer a booking the API will reject.

### 5.2 `ferry.controller.ts` — the endpoint surface (gaps 1, 3, 9)

Existing routes/schedules CRUD is unchanged. The bookings section is restructured:

| Method | Path                                | Roles       | Notes                                                   |
| ------ | ----------------------------------- | ----------- | ------------------------------------------------------- |
| GET    | `/ferry/bookings`                   | staff       | Now returns the **enriched** row (§5.3)                 |
| GET    | `/ferry/bookings/mine`              | `@Roles()`  | Visitor's own; §7                                       |
| GET    | `/ferry/bookings/lookup/:reference` | staff       | Read-only preview for the validation screen             |
| GET    | `/ferry/bookings/:id`               | staff       | Enriched row                                            |
| GET    | `/ferry/bookings/:id/pass`          | staff + owner | The ferry pass payload                                |
| POST   | `/ferry/bookings`                   | `@Roles()`  | Visitor self-service; `userId` from JWT; forces `pending` |
| POST   | `/ferry/bookings/manual`            | staff       | Counter booking for a named guest (today's behaviour)   |
| POST   | `/ferry/bookings/:id/issue`         | staff       | `pending → confirmed`; records payment; returns pass    |
| POST   | `/ferry/bookings/validate`          | staff       | By reference; `confirmed → validated`; **200, not 201** |
| POST   | `/ferry/bookings/:id/cancel`        | `@Roles()`  | Owner or staff                                          |
| PATCH  | `/ferry/bookings/:id`               | staff       | **Real DTO class**; `scheduleId` + `passengerCount` only |

**Gap 9 specifically.** `@Body() dto: Partial<CreateFerryBookingDto>` is a TypeScript type, so
Nest's metatype is `Object` and the global `ValidationPipe` skips the body entirely — `whitelist`
and `forbidNonWhitelisted` included. Fix it with a real class, and move status changes off the
generic PATCH onto the dedicated action endpoints above:

```ts
// dto/update-ferry-booking.dto.ts
export class UpdateFerryBookingDto {
  @IsOptional() @IsInt() @IsPositive() scheduleId?: number;
  @IsOptional() @IsInt() @Min(1) @Max(255) passengerCount?: number;
}
```

`status`, `validatedBy` and `validatedAt` are **removed from every client-facing DTO**, including
`CreateFerryBookingDto`. They are server-controlled — that is the other half of gap 1. Creation
always yields `pending`; `validatedBy` always comes from `@CurrentUser()`.

**The two new service methods**, both mirroring `ParkTicketsService.validate`:

```ts
/** Issue the pass. The spec's "provide customer with a ferry pass if valid hotel booking exist". */
async issue(staff: AuthenticatedUser, id: number): Promise<FerryPass> {
  const booking = await this.getBookingById(id);
  if (booking.status === 'confirmed') throw new ConflictException('Pass already issued');
  if (booking.status === 'validated') throw new ConflictException('Passenger already boarded');
  if (booking.status === 'cancelled') throw new ConflictException('This booking was cancelled');

  // Re-run eligibility at issue time — the stay may have been cancelled since the request.
  const schedule = await this.getScheduleById(booking.scheduleId);
  const hotelBooking = await this.ferryRepo.findHotelBookingById(booking.hotelBookingId);
  this.assertHotelBookingEligible(hotelBooking, booking.userId, schedule.departureAt);

  await this.ferryRepo.updateBooking(id, { status: 'confirmed' });
  await this.ferryRepo.recordMockPayment({ ... });   // mirrors hotel-bookings.repository.ts:342
  await this.audit.record({
    userId: staff.id,
    action: AuditAction.FerryBookingIssued,
    subjectType: 'FerryBooking',
    subjectId: id,
    metadata: { bookingReference: booking.bookingReference },
  });
  return this.getPass(id);
}

/** Jetty check-in. Every rejection names its own reason. */
async validate(staff: AuthenticatedUser, dto: ValidateFerryPassDto): Promise<FerryBookingRow> {
  const booking = await this.lookup(dto.bookingReference);      // 404 if unknown

  if (booking.status === 'validated') {
    throw new ConflictException(`Already boarded at ${booking.validatedAt.toISOString()}`);
  }
  if (booking.status === 'cancelled') throw new ConflictException('This booking was cancelled');
  if (booking.status === 'pending') {
    throw new ConflictException('No pass has been issued for this booking yet');
  }
  if (!isSameUtcDay(booking.departureAt, new Date())) {
    throw new ConflictException(
      `This pass is for ${toDateKey(booking.departureAt)}, not today`,
    );
  }

  await this.ferryRepo.updateBooking(booking.id, {
    status: 'validated',
    validatedBy: staff.id,          // ← from the JWT, never the body
    validatedAt: new Date(),
  });
  await this.audit.record({ userId: staff.id, action: AuditAction.FerryBookingValidated, ... });
  return this.getBookingById(booking.id);
}
```

`getPass(id)` returns `{ bookingReference, guestName, routeName, origin, destination, departureAt,
direction, passengerCount, totalAmount, hotelName, hotelBookingReference, status, issuedAt }` —
everything the printable pass and the QR need.

### 5.3 Enriched read models (gap 6)

`findAllBookings` returns raw table rows, so the bookings page can only display a reference and a
route name, and the search box's "or guest name" promise is unfulfillable.

Add `FerryBookingRow` — one join, used by the list, the single-booking read, and `lookup`:

```ts
// ferry.repository.ts
export interface FerryBookingRow {
  id: number;
  bookingReference: string;
  status: FerryBooking['status'];
  passengerCount: number;
  totalAmount: string;
  createdAt: Date;
  validatedAt: Date | null;
  // guest
  userId: number;
  guestName: string;
  guestEmail: string;
  // sailing
  scheduleId: number;
  routeName: string;
  departureAt: Date;
  direction: FerrySchedule['direction'];
  // prerequisite stay
  hotelBookingId: number;
  hotelName: string;
  hotelBookingReference: string;
  hotelCheckIn: Date;
  hotelCheckOut: Date;
  hotelStatus: HotelBooking['status'];
}
```

`ferry_bookings ⋈ users ⋈ ferry_schedules ⋈ ferry_routes ⋈ hotel_bookings ⋈ hotels`. Every FK is
`NOT NULL`, so all six are inner joins.

Support `GET /ferry/bookings?status=&scheduleId=&routeId=&from=&to=&q=` with `q` matching booking
reference, guest name, or guest email **server-side** — the current client-side filter over a
partial payload is what makes gap 6 user-visible.

### 5.4 Passenger manifest (gap 4, "passenger list")

```
GET /ferry/schedules/:id/manifest
```

```ts
{
  schedule: { id, routeName, origin, destination, departureAt, direction, status, capacity },
  totals:   { bookings, passengers, validated, remaining, loadFactor },
  passengers: FerryBookingRow[]   // ordered: pending → confirmed → validated, then reference
}
```

Cancelled bookings are excluded from `totals` but returned in `passengers` with their status, so
the operator can see a withdrawal rather than wonder where someone went. This is the printable
boarding list.

### 5.5 New module: `ferry-reports` (gap 4, "trip reports")

Mirrors `park-reports` exactly — **aggregate only, never guest names, emails or references.**
`@Roles(Role.Admin, Role.FerryStaff)`. Four files: controller / service / repository / module.

| Method | Path                    | Query                    | Returns                                            |
| ------ | ----------------------- | ------------------------ | -------------------------------------------------- |
| GET    | `/ferry-reports/sales`  | `from,to,groupBy`        | period, bookings, passengers, revenue               |
| GET    | `/ferry-reports/trips`  | `from,to,routeId`        | per sailing: capacity, booked, loadFactor, revenue, validated, noShows |
| GET    | `/ferry-reports/routes` | `from,to`                | per route: sailings, passengers, revenue, avg load  |

`groupBy` is `day | week | month`, validated by a `parseGroupBy` helper copied from
[park-reports.controller.ts](../apps/backend/src/modules/park-reports/park-reports.controller.ts).

Two definitions to fix in code so the numbers are defensible:

- **revenue** — `SUM(total_amount)` over bookings with `status IN ('confirmed','validated')`.
  Never `pending` (nothing collected), never `cancelled`.
- **noShows** — `booked − validated`, **reported only for sailings whose status is `departed`**.
  A scheduled sailing has no no-shows, it has passengers who have not boarded yet.

### 5.6 New module: `ferry-dashboard` (gap 5)

Mirrors `park-dashboard`: one aggregate `GET /ferry-dashboard`, `@Roles(Role.Admin, Role.FerryStaff)`.

Shape it to **exactly** the four blocks the mock page already renders, so the frontend swaps
hardcoded arrays for query data with minimal churn:

```ts
{
  stats: { pendingValidations, todaysDepartures, seatsFilledPct },
  nextSailings:   [{ scheduleId, departureAt, routeName, booked, capacity, status }],  // next 5
  routeOccupancy: [{ routeId, routeName, occupancyPct, trend }],
  recentRequests: [{ bookingId, guestName, hotelStatusLabel, createdAt, status }],     // last 5
}
```

`seatsFilledPct` is over **today's** sailings only, matching the existing card's "Capacity across
morning sailings" hint.

### 5.7 Cross-cutting

**Audit actions** — add to
[audit-action.enum.ts](../apps/backend/src/shared/enums/audit-action.enum.ts), following the
existing `domain.verb` naming:

```
ferry_route.created / .updated / .deleted
ferry_schedule.created / .updated / .cancelled
ferry_booking.created / .issued / .validated / .cancelled
```

Record on every mutation, with `subjectType` `'FerryRoute' | 'FerrySchedule' | 'FerryBooking'`.
The ferry module currently records nothing — this is the single biggest divergence from hotel/park.

**Module wiring** — `FerryModule` must import `AuditModule`; register `FerryDashboardModule` and
`FerryReportsModule` in `app.module.ts`.

**Deletes become guarded.** `removeRoute` / `removeSchedule` currently hard-delete and will throw a
raw FK error once real data exists. Reject with a `ConflictException` naming the dependant count:
_"Cannot delete a route with 4 scheduled sailings"_ / _"Cannot delete a sailing with 12 bookings —
cancel it instead"_.

---

## 6. Frontend

All paths under `apps/frontend/src/`.

### 6.1 Role guard — `routes/dashboard/ferry/route.tsx` (new)

Ferry is the only staff area without one. Copy
[dashboard/park/route.tsx](../apps/frontend/src/routes/dashboard/park/route.tsx) verbatim,
swapping `park_staff` for `ferry_staff`. **Do this first** — it is five minutes and it is a real
authorisation hole.

### 6.2 `ferry-dashboard-page.tsx` — delete the fiction (gap 5)

Remove the `stats`, `schedules`, `routeHighlights` and `recentRequests` module-level arrays and the
hardcoded `Guest: Maria Santos / #HB-2048` card. Drive all four blocks from
`ferryDashboardQueryOptions`. Keep the existing layout and `CapacityBar`-style occupancy bars —
replace the hardcoded Tailwind width classes (`w-[82%]`, `w-[61%]`…) with an inline style width, or
reuse [features/park/components/capacity-bar.tsx](../apps/frontend/src/features/park/components/capacity-bar.tsx).

The "Validate ferry pass" card becomes a real entry point: a reference input that calls
`lookupFerryPassServerFn` and shows the true guest, sailing and stay, or navigates to §6.3.

### 6.3 `ferry-bookings-page.tsx` — the operator's main screen (gaps 1, 3, 6)

The largest single piece of work.

- **Row content.** Show guest name, sailing (route + departure), hotel booking reference and stay
  dates, passenger count, total, status. Today a row shows only a reference and a route name.
- **Search.** Move filtering server-side via `?q=` and `?status=`; add status filter chips
  (All / Pending / Confirmed / Validated / Cancelled). The placeholder already promises guest-name
  search — §5.3 makes it true.
- **Replace the dead "Review" button.** It has no `onClick`
  ([ferry-bookings-page.tsx:337-339](../apps/frontend/src/features/ferry/pages/ferry-bookings-page.tsx)).
  It becomes a status-dependent action: **Issue pass** on `pending`, **View pass** on `confirmed`,
  **View details** on `validated`.
- **New `ferry-pass-dialog.tsx`.** The printable pass: reference as a QR, guest, route,
  departure, direction, passenger count, hotel booking reference, amount paid. `@media print`
  rules so it prints on its own. This is the deliverable for spec bullet "Provide customer with a
  ferry pass" — gap 3.
- **New `ferry-validation-page.tsx`** at `/dashboard/ferry/validate`. Mirrors
  [park-gate-page.tsx](../apps/frontend/src/features/park/pages/park-gate-page.tsx): a large
  reference input, a details panel (guest / sailing / stay / eligibility), and a **Board passenger**
  button. Rejections render the server's reason verbatim — that message is the whole point of the
  screen. This is spec GUI bullet "Ticket validation interface (check booking details)" — gap 1.
- **Creation dialog stays**, retargeted at `POST /ferry/bookings/manual`. Drop the status
  `<Select>` — status is server-controlled now (§5.2); a counter booking is created then issued.

### 6.4 Routes and schedules — make them manageable (gap 8)

Both pages are create-only while the API has had PATCH and DELETE all along.

- Extract the inline create dialogs into `ferry-route-dialog.tsx` and `ferry-schedule-dialog.tsx`
  that take an optional `route`/`schedule` prop and switch between create and edit — the pattern
  [event-dialog.tsx](../apps/frontend/src/features/park/components/event-dialog.tsx) uses.
- Add an edit action per row, and a delete action that surfaces the §5.7 conflict message.
- Schedules get a **Cancel sailing** action (status → `cancelled`) and a **Manifest** link to
  §6.6 — cancelling is the realistic operation, deleting almost never is.
- **Wire the routes page's dead search input**
  ([ferry-routes-page.tsx:160](../apps/frontend/src/features/ferry/pages/ferry-routes-page.tsx)) —
  it has no `value`/`onChange` at all. Filter on name, origin, destination.
- Remove the hardcoded marketing copy ("Peak traffic is expected between 08:00 and 13:00",
  "Consider adding extra capacity to Picnic Bay Express") — it names a route that does not exist.
- Remove the unused `CompassIcon` import in `ferry-schedules-page.tsx`.

### 6.5 New `ferry-reports-page.tsx` (gap 4)

At `/dashboard/ferry/reports`. Mirrors
[park-reports-page.tsx](../apps/frontend/src/features/park/pages/park-reports-page.tsx): a date-range
picker, a `groupBy` toggle, a revenue/passenger chart reusing the `--series-ferry` colour already
defined in [constants.ts](../apps/frontend/src/features/reports/constants.ts), and a trips table
(sailing, route, capacity, booked, load %, validated, revenue).

Per [CLAUDE.md](../CLAUDE.md) and the `dataviz` conventions, the chart must read in both light and
dark themes.

### 6.6 New `ferry-manifest-page.tsx` (gap 4)

At `/dashboard/ferry/schedules/$scheduleId/manifest`. Header summarises the sailing and load;
below it the passenger table with a per-row boarding tick. Include a **Print manifest** button —
this is the physical boarding list the operator carries onto the vessel.

### 6.7 Navigation

[app-shared.tsx:120-142](../apps/frontend/src/components/app-shared.tsx) — the `ferry_staff` array
grows from four items to two groups, matching how `hotel_staff` and `park_staff` are structured:

```
Ferry:    Dashboard · Routes · Schedules · Bookings · Validate
Insights: Reports
```

---

## 7. Visitor ferry purchase flow

**Why this is in scope.** The operator's core loop is "validate incoming requests", but today no
visitor can create one: [routes/ferry/index.tsx](../apps/frontend/src/routes/ferry/index.tsx) is a
"Coming soon" email-waitlist stub and `POST /ferry/bookings` is staff-only. The booking queue can
only ever contain rows staff typed in themselves. Without this phase, §6.3's validation screen has
nothing authentic to validate.

**It is also its own spec requirement** — §1 GUI: _"Ferry ticket reservation form, with validation
against hotel bookings."_

Backend is mostly done by §5.2. What remains:

- `GET /ferry/bookings/mine` and `GET /ferry/schedules` gain `?from&to&direction&routeId` plus a
  computed `remainingSeats` per sailing, so a visitor never selects a full one.
- `GET /ferry/my-hotel-bookings` — the eligible-stays picker for the visitor's own account.
  Reuses `listHotelBookingsForUser` with the user ID from the JWT rather than the path.
- `POST /ferry/bookings` ignores any `userId` in the body and takes it from `@CurrentUser()`.
  A visitor booking on someone else's stay must be impossible, not merely unlikely.

Frontend — replace the waitlist stub with:

- `/ferry` — real route and sailing browsing, with the eligibility rule stated up front
  ("A confirmed hotel booking is required").
- `/ferry/book` — the reservation form: pick a stay → pick a sailing → passenger count → total →
  confirm. Server-side errors from §5.1 render inline; a visitor with no eligible stay is sent to
  `/hotels` rather than shown an empty picker.
- `/ferry/bookings/$id` — their pass (reuses `ferry-pass-dialog`'s body), pending until staff issue it.

---

## 8. Seeds

[seeds/demo.ts](../apps/backend/src/shared/database/seeds/demo.ts) currently creates **one** ferry
route, four sailings and three bookings. Two problems:

1. **The dashboard and reports will look empty.** The mock UI promised "3 active routes" and
   "8 departures today". Expand to 3 routes, ~20 sailings spanning −14 to +14 days, and ~40
   bookings across all four statuses so the charts, occupancy bars and trip reports have shape.
2. **Existing seed rows may violate the new §5.1 rules.** They were written when the only check was
   "not cancelled". Every seeded ferry booking must now satisfy: hotel booking owned by the same
   user, status `confirmed`/`completed`, and sailing date inside the stay ± 1 day. **Verify each
   one** — otherwise the demo database contains bookings the API would refuse to create, and
   reports will show numbers the app cannot reproduce.

Also seed a handful of `pending` bookings dated in the future, so the validation and issuance
screens have something to act on during a demo.

---

## 9. Build order

Each phase is independently shippable and leaves the app working.

| Phase | Scope                                                                    | Closes      |
| ----- | ------------------------------------------------------------------------ | ----------- |
| 0     | `dashboard/ferry/route.tsx` role guard                                    | (auth hole) |
| 1     | §5.1 rules + capacity fix; §5.2 DTO classes; audit actions; module wiring  | 2, 7, 9     |
| 2     | §5.3 enriched rows; issue + validate + lookup endpoints                   | 1, 3, 6     |
| 3     | §6.3 bookings page rebuild, pass dialog, validation page                  | 1, 3, 6     |
| 4     | §6.4 routes/schedules edit + delete + cancel; wire dead search            | 8           |
| 5     | §5.6 `ferry-dashboard` + §6.2 real dashboard                              | 5           |
| 6     | §5.4 manifest + §5.5 `ferry-reports` + §6.5 §6.6 pages                    | 4           |
| 7     | §7 visitor flow                                                           | (input)     |
| 8     | §8 seeds                                                                  | —           |

Phase 1 is a **breaking API change** (`status` and `validatedBy` leave the create DTO). Land it and
phase 3 in the same sprint, or the existing creation dialog breaks in between.

---

## 10. Tests

The ferry module has no spec file today. Add `ferry.service.spec.ts` following
[reports.service.spec.ts](../apps/backend/src/modules/reports/reports.service.spec.ts). Minimum
coverage — these are the rules the DB cannot express, so they are the ones worth testing:

- rejects a hotel booking owned by a different user
- rejects a `pending` hotel booking
- rejects a sailing outside the stay window; accepts one inside the ±1-day grace
- excludes cancelled bookings from the capacity sum (cancel then rebook the freed seat)
- rejects booking onto a `departed` / `cancelled` / past sailing
- `issue` rejects an already-issued booking; re-checks eligibility at issue time
- `validate` rejects a pass for another day, an unissued booking, and a second boarding
- `validate` writes `validatedBy` from the passed-in staff user, never from input

---

## 11. Out of scope

- **Per-route staff scoping.** Decision 3 — role-only RBAC. `user_assignments` keeps its
  `'ferry_route'` type unused.
- **Real payment processing.** `recordMockPayment` mirrors hotel; the whole system is mock-payment.
- **QR scanning by camera.** Reference entry only — decision 5.
- **Vessels, crew, or fuel/maintenance tracking.** Not in the requirement.
- **`arrival_at` on `ferry_schedules`.** The visitor stub shows arrival times, but the schema has
  only `departure_at` and the requirement never asks for arrivals. Dropping the fake arrival column
  from the UI is cheaper than a migration; revisit only if the group wants it.
- **Auto-cancelling bookings when a sailing is cancelled.** Decision 6.
