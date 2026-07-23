# Backend Guide (simple version)

This guide explains how to work with **`apps/backend`** — the server side of the island booking app.

Think of it like this:

- The **frontend** is the shop window (what you click and see).
- The **backend** is the kitchen + storage room (where orders are checked, saved, and sent back).

---

## What lives in `apps/backend`?

```
apps/backend/
├── src/
│   ├── main.ts              ← turns the server ON (like flipping the “Open” sign)
│   ├── app.module.ts        ← lists all the “departments” the server has
│   ├── modules/             ← one folder per topic (hotels, bookings, auth, …)
│   ├── shared/              ← shared tools (database, guards, helpers)
│   └── config/              ← reads settings from .env
├── data/
│   └── dev.db               ← your SQLite database file (appears after migrate)
└── .env                     ← secret settings (passwords, ports) — YOU create this
```

Each **module** (e.g. `hotels/`) usually has four jobs:

| File | Simple job |
|------|------------|
| `*.controller.ts` | The **reception desk** — listens for HTTP requests (`GET /hotels`) |
| `*.service.ts` | The **brain** — decides the rules (“can this user see this hotel?”) |
| `*.repository.ts` | The **librarian** — reads/writes the database |
| `dto/*.dto.ts` | The **form** — checks the data people send is valid |

Request flow:

```
Browser  →  Controller  →  Service  →  Repository  →  SQLite file
                ↑                                              |
                └──────────── JSON answer goes back ───────────┘
```

---

## First-time setup (do this once)

Open a terminal and go to the backend folder:

```bash
cd tms/apps/backend
```

### Step 1 — Create `.env`

The server needs a secret password (JWT) or it refuses to start.

Create `apps/backend/.env` with at least:

```env
JWT_SECRET=dev_only_change_me_4f8c2a1b9e7d6c5a3f2e1d0c9b8a7654
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_ISSUER=booking-system
JWT_AUDIENCE=booking-system-clients

PORT=4000
NODE_ENV=development
DATABASE_PATH=./data/dev.db
CORS_ORIGIN=http://localhost:3000

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

> **JWT_SECRET** must be at least 32 characters. Never commit real secrets to Git.

### Step 2 — Build the database tables

```bash
npm run db:migrate
```

This creates `data/dev.db` and all the tables (users, hotels, bookings, …).

### Step 3 — Fill it with demo data

```bash
npm run db:seed
```

This adds test users, sample hotels, bookings, etc. Safe to run again — it skips things that already exist.

---

## Every-day commands

Run these **from `apps/backend`** unless noted.

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start the server and auto-restart when you edit code |
| `npm test` | Run automated checks (like a spelling test for your code) |
| `npm run build` | Compile TypeScript to JavaScript for production |
| `npm run db:migrate` | Apply database structure changes |
| `npm run db:seed` | Add/update demo data |
| `npm run db:generate` | After you change a schema file, create a new migration |

When `dev` works, you should see:

```
🚀 Backend listening on http://localhost:4000/api/v1
```

### Running frontend + backend together

From the monorepo root (`tms/`):

```bash
npm run dev
```

On Windows, if that fails instantly, run **two terminals**:

```bash
# Terminal 1
cd tms/apps/backend
npm run dev

# Terminal 2
cd tms/apps/frontend
npm run dev
```

Frontend: `http://localhost:3000` (or 3001 if 3000 is busy)  
Backend API: `http://localhost:4000/api/v1`

---

## Test logins (after seed)

| Email | Password | Who they are |
|-------|----------|--------------|
| `admin@example.com` | `ChangeMe123!` | Boss — sees everything |
| `hotel@example.com` | `ChangeMe123!` | Hotel worker |
| `ferry@example.com` | `ChangeMe123!` | Ferry worker |
| `park@example.com` | `ChangeMe123!` | Theme park worker |

Staff password comes from `STAFF_PASSWORD` in `.env`, or defaults to `ChangeMe123!`.

---

## How URLs work

All API routes start with:

```
http://localhost:4000/api/v1/
```

Examples:

| What you want | URL |
|---------------|-----|
| Health check | `GET /api/v1/health` |
| Log in | `POST /api/v1/auth/login` |
| Who am I? | `GET /api/v1/auth/me` |
| List hotels (staff) | `GET /api/v1/hotels` |
| Browse hotels (public) | `GET /api/v1/public/hotels` |
| My bookings (visitor) | `GET /api/v1/hotel-bookings/mine` |

Try health check in the browser:

```
http://localhost:4000/api/v1/health
```

If you see JSON, the kitchen is open.

---

## Who can call what?

The backend checks **roles** like a bouncer at a club:

| Role | Can do |
|------|--------|
| `visitor` | Book trips, see their own bookings |
| `hotel_staff` | Manage their assigned hotel(s) |
| `ferry_staff` | Ferry stuff |
| `park_staff` | Park stuff |
| `admin` | Almost everything |

Special markers in code:

- `@Public()` — anyone can call (no login)
- `@Roles(...)` — only certain roles
- `@CurrentUser()` — “give me the logged-in person”

Login uses **cookies** (not just a token in memory), so the frontend must call the API with credentials enabled.

---

## The database (where data is stored)

- **Engine:** SQLite (one file: `data/dev.db`)
- **ORM:** Drizzle (TypeScript descriptions of tables)
- **Schema files:** `src/shared/database/schema/*.schema.ts`
- **Migrations:** `src/shared/database/migrations/`

### When you change a table

1. Edit the `.schema.ts` file (e.g. add a column to `hotel-bookings.schema.ts`)
2. Run `npm run db:generate` to create a migration SQL file
3. Run `npm run db:migrate` to apply it

For quick local experiments only (not for team/production):

```bash
npm run db:push
```

That pushes schema directly without a migration file.

---

## Main modules (departments)

| Folder | Topic |
|--------|--------|
| `auth/` | Sign up, log in, log out, “who am I?” |
| `users/` | Admin managing users |
| `hotels/` | Staff hotel list (scoped) |
| `room-types/` | Room type catalog |
| `rooms/` | Physical rooms in a hotel |
| `hotel-bookings/` | Bookings + assign room |
| `hotel-dashboard/` | Stats for hotel staff home page |
| `hotel-reports/` | Revenue / occupancy charts |
| `public-hotels/` | Visitor browsing (no staff login) |
| `promotions/` | Discounts |
| `advertisements/` | Homepage ads |
| `map-locations/` | Island map pins |
| `reports/` | Admin-wide reports |
| `audit-logs/` | “Who did what” history |

Shared helpers:

| Folder | Topic |
|--------|--------|
| `shared/hotel-access/` | “Which hotels is this staff member allowed to see?” |
| `shared/guards/` | Block requests without login or wrong role |
| `shared/database/seeds/` | Demo data scripts |

---

## Common problems

### “JWT_SECRET is required”

→ Create `apps/backend/.env` (see Step 1 above).

### “no such table: users”

→ Run `npm run db:migrate` then `npm run db:seed`.

### Frontend can’t log in / cookies don’t stick

→ Check `CORS_ORIGIN` matches your frontend URL (usually `http://localhost:3000`).

### `npm run db:migrate` from repo root fails

→ That script lives in the **backend** package. `cd apps/backend` first.

### Port already in use

→ Something else is on 4000. Stop the old server or change `PORT` in `.env`.

More fixes: [issuesFaced.md](./issuesFaced.md)

---

## How to add a new feature (small checklist)

1. **Schema** — do you need a new table or column? Update `schema/` → migrate.
2. **Module** — create `modules/my-thing/` with controller, service, repository.
3. **Register** — import the module in `app.module.ts`.
4. **DTO** — define what JSON the API accepts.
5. **Roles** — add `@Roles` or `@Public` on the controller.
6. **Test** — add a `*.spec.ts` or hit the route manually.
7. **Frontend** — add a server function that calls your new endpoint.

---

## Files worth bookmarking

| File | Why |
|------|-----|
| [app-guid.md](./app-guid.md) | Run frontend + backend together |
| [frontend-guid.md](./frontend-guid.md) | Website (simple guide) |
| [hoteldomain.md](./hoteldomain.md) | Hotel tables, modules, and add-feature recipes |
| [development-guide.md](./development-guide.md) | Full monorepo workflow |
| [Db_Schema.md](../Db_Schema.md) | All tables explained |
| [requirements.md](../requirements.md) | What the app should do |
| [issuesFaced.md](./issuesFaced.md) | Problems we already solved |
| [hotelImplementation.md](./hotelImplementation.md) | Hotel module details |

---

## One-sentence summary

**Start the backend, migrate + seed the database, talk to it at `http://localhost:4000/api/v1`, and remember: Controller = door, Service = brain, Repository = database librarian.**
