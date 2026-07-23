# App Guide — working with frontend + backend together

This guide explains how **`apps/frontend`** and **`apps/backend`** fit together as one app.

Simple picture:

```
┌─────────────────────────────────────────────────────────┐
│  YOUR BROWSER  (http://localhost:3000)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Frontend — pages, buttons, forms               │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTP + cookies
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Backend API  (http://localhost:4000/api/v1)            │
│  checks login, reads/writes SQLite database             │
└─────────────────────────────────────────────────────────┘
```

- **Frontend guide:** [frontend-guid.md](./frontend-guid.md)
- **Backend guide:** [backend-guid.md](./backend-guid.md)
- **Hotel domain (beginner):** [hoteldomain.md](./hoteldomain.md)

---

## The whole project folder

```
tms/                          ← monorepo root (run npm install here)
├── apps/
│   ├── frontend/             ← website (port 3000)
│   └── backend/              ← API + database (port 4000)
├── context/                  ← docs (you are here)
└── package.json              ← scripts that run both apps
```

---

## First day — full setup (copy-paste order)

Open a terminal. Do everything **once** before your first real dev session.

### 1. Install everything

```bash
cd tms
npm install
```

### 2. Backend secrets + database

```bash
cd apps/backend
```

Create `apps/backend/.env` (if it doesn’t exist):

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

Then:

```bash
npm run db:migrate
npm run db:seed
```

You should see ✅ messages about roles, admin, staff, and demo data.

### 3. (Optional) Frontend API URL

Only needed if backend isn’t on port 4000.

Create `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

### 4. Start both apps

**Recommended on Windows — two terminals:**

```bash
# Terminal 1 — backend
cd tms/apps/backend
npm run dev
```

Wait until you see:

```
🚀 Backend listening on http://localhost:4000/api/v1
```

```bash
# Terminal 2 — frontend
cd tms/apps/frontend
npm run dev
```

Wait until you see:

```
➜  Local:   http://localhost:3000/
```

Open **http://localhost:3000** in your browser.

---

## Every day — quick start

1. Start **backend** first (Terminal 1)
2. Start **frontend** second (Terminal 2)
3. Open the frontend URL from the terminal
4. When done: `Ctrl+C` in each terminal

You can also try from `tms/`:

```bash
npm run dev
```

On some Windows setups this fails instantly (Turbo bug). If that happens, use two terminals — that always works.

---

## How to know both are healthy

| Check | URL | Good sign |
|-------|-----|-----------|
| Backend alive | http://localhost:4000/api/v1/health | JSON response |
| Frontend alive | http://localhost:3000 | Home page loads |
| They talk | Log in at `/login` | Redirects to dashboard, no CORS error |

Quick login test:

- Email: `hotel@example.com`
- Password: `ChangeMe123!`
- Should land on `/dashboard/hotel`

---

## Ports — keep these matching

| Service | Default port | Config file |
|---------|--------------|-------------|
| Frontend | 3000 | Vite picks next free port if busy |
| Backend | 4000 | `apps/backend/.env` → `PORT` |

**Golden rule:** `CORS_ORIGIN` in backend `.env` must match your **frontend** URL exactly.

| Frontend running on | Set in backend `.env` |
|----------------------|------------------------|
| http://localhost:3000 | `CORS_ORIGIN=http://localhost:3000` |
| http://localhost:3001 | `CORS_ORIGIN=http://localhost:3001` |
| http://localhost:3003 | `CORS_ORIGIN=http://localhost:3003` |

If login “works” but nothing loads, or you see CORS errors in DevTools → Console, this is usually the fix.

---

## How a click travels through the app

Example: **hotel staff opens the bookings page**

```
1. Browser → GET /dashboard/hotel/bookings
2. Frontend route loader → prefetch bookings via server.ts
3. server.ts → GET http://localhost:4000/api/v1/hotel-bookings?hotelId=1
   (sends login cookie)
4. Backend controller → service → repository → SQLite
5. JSON list of bookings comes back
6. React Query caches it
7. Page renders the table
```

Example: **visitor books a hotel**

```
1. Browse /hotels (public API — no login)
2. Pick dates + room on /hotels/1/book
3. At payment step → login or signup inline
4. POST /api/v1/hotel-bookings (now with cookie)
5. Redirect to confirmation page
```

---

## Who sees what

| Role | Login | Main URLs |
|------|-------|-----------|
| Visitor | Sign up or browse | `/`, `/hotels`, `/map`, `/my-bookings` |
| Hotel staff | `hotel@example.com` | `/dashboard/hotel/*` |
| Admin | `admin@example.com` | `/dashboard/admin/*` |
| Ferry / park staff | `ferry@…` / `park@…` | `/dashboard/ferry`, `/dashboard/park` (stubs) |

All passwords after seed: **`ChangeMe123!`** (unless you changed `.env`).

---

## When you change something — who to touch?

| You want to… | Edit mainly… |
|--------------|--------------|
| Change a button or layout | `apps/frontend` → feature `pages/` or `components/` |
| Add a new API endpoint | `apps/backend` → new module or controller method |
| Add a new database column | `apps/backend` → `schema/` → `db:generate` → `db:migrate` |
| Wire frontend to new API | `frontend` → `server.ts` + `queries.ts` + route/page |
| Change who can access an API | `backend` → `@Roles` on controller |
| Change who sees a page | `frontend` → `beforeLoad` guard on route |

**Typical feature flow:**

1. Backend: schema → migrate → controller/service/repository
2. Test API in browser or Postman (`/api/v1/...`)
3. Frontend: server.ts → queries.ts → page → route
4. Click through in the browser

---

## Useful commands cheat sheet

From **`tms/`** (whole project):

```bash
npm install          # install all packages
npm run build        # build frontend + backend
npm run format       # prettify code
```

From **`apps/backend`**:

```bash
npm run dev          # start API
npm test             # run tests
npm run db:migrate   # apply DB changes
npm run db:seed      # demo data
```

From **`apps/frontend`**:

```bash
npm run dev          # start website
npm run build        # production build + typecheck
```

---

## Common “whole app” problems

### Frontend loads but everything is empty / errors in Network tab

→ Backend not running. Start Terminal 1 first.

### `JWT_SECRET is required`

→ Missing `apps/backend/.env`. See [backend-guid.md](./backend-guid.md).

### `no such table: users`

→ Run `db:migrate` and `db:seed` in backend.

### Login spins forever or 401

→ CORS / port mismatch. Align `CORS_ORIGIN` with frontend URL.

### `npm run db:migrate` “Missing script” from repo root

→ Database scripts live in **backend only**. `cd apps/backend` first.

### Multiple dev servers / wrong port

→ Close old terminals. Kill stray Node processes. Start fresh on 3000 + 4000.

### Turbo says `Failed: frontend#dev` in 1 second

→ Windows + Turbo persistent task bug. Use two terminals instead.  
→ Details: [issuesFaced.md](./issuesFaced.md) §4

---

## Suggested smoke test (5 minutes)

After both servers are up:

1. **Home** — `/` — hero, hotel cards, no black void
2. **Public hotels** — `/hotels` — list loads
3. **Login** — `hotel@example.com` / `ChangeMe123!`
4. **Staff dashboard** — `/dashboard/hotel` — stats + priority actions
5. **Bookings** — assign a room to an unassigned booking
6. **Logout** — sign out, browse `/hotels` as visitor
7. **Sign up** — new visitor account, check `/my-bookings`

If all seven pass, frontend and backend are talking properly.

---

## Where to go next

| Goal | Read |
|------|------|
| Deep dive backend | [backend-guid.md](./backend-guid.md) |
| Deep dive frontend | [frontend-guid.md](./frontend-guid.md) |
| Hotel domain (tables + UI recipes) | [hoteldomain.md](./hoteldomain.md) |
| Hotel module specifics | [hotelImplementation.md](./hotelImplementation.md) |
| Bugs we already fixed | [issuesFaced.md](./issuesFaced.md) |
| Formal frontend patterns | [frontend-guideline.md](../frontend-guideline.md) |

---

## One-sentence summary

**Install once, migrate + seed the backend, run backend on 4000 and frontend on 3000, keep CORS_ORIGIN matching, then build features on the API first and wire the UI second.**
