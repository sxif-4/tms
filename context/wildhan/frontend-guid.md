# Frontend Guide (simple version)

This guide explains how to work with **`apps/frontend`** — the website you click and see.

Remember the analogy:

- **Frontend** = the shop window (buttons, pages, colours)
- **Backend** = the kitchen (saves data, checks passwords)

You edit the frontend when you want to **change what people see or click**.

For the server side, read [backend-guid.md](./backend-guid.md).  
For using **both together**, read [app-guid.md](./app-guid.md).

---

## What lives in `apps/frontend`?

```
apps/frontend/
├── public/                  ← pictures & files served as-is (/images/hero/…)
├── src/
│   ├── routes/              ← URLs (each file = a page address)
│   ├── features/            ← real app logic grouped by topic
│   ├── components/          ← shared UI bits (header, buttons, sidebar)
│   ├── styles/app.css       ← colours, glass effect, theme tokens
│   └── lib/                 ← helpers (API caller, utils)
├── routeTree.gen.ts         ← AUTO-GENERATED — never edit by hand!
└── package.json
```

---

## The three layers (how a page works)

When you open `/hotels`, this happens:

```
1. routes/hotels/index.tsx     ← “This URL loads the hotels page”
2. features/hotel-browsing/    ← “Here’s the actual screen + data logic”
3. Backend API                 ← “Give me the list of hotels” (via server.ts)
```

Think of it like a **restaurant menu → kitchen order → food delivery**:

| Layer | Folder | Job |
|-------|--------|-----|
| **Address** | `routes/` | Which URL shows which page |
| **Screen** | `features/*/pages/` | What you see (lists, forms, charts) |
| **Phone to kitchen** | `features/*/server.ts` | Calls the backend safely |
| **Memory while browsing** | `features/*/queries.ts` | Caches data so pages feel fast |

---

## Inside a feature folder

Each topic (hotels, auth, map, …) lives in `src/features/<name>/`:

```
features/hotels/
├── pages/           ← full screens (dashboard, bookings, rooms)
├── components/      ← smaller pieces (dialogs, badges, charts)
├── server.ts        ← talks to backend (createServerFn)
├── queries.ts       ← React Query helpers (when to fetch/cache)
├── types.ts         ← TypeScript shapes for data
└── constants.ts     ← labels, colours, filter options
```

**Rule:** Put UI in `pages/` and `components/`. Put API calls in `server.ts`.  
**Rule:** Route files stay **thin** — they only connect URL → page + preload data.

---

## Routes = URLs

Files in `src/routes/` map to browser addresses:

| File | URL |
|------|-----|
| `routes/index.tsx` | `/` (home) |
| `routes/hotels/index.tsx` | `/hotels` |
| `routes/hotels/$hotelId/book.tsx` | `/hotels/123/book` |
| `routes/login.tsx` | `/login` |
| `routes/dashboard/hotel/index.tsx` | `/dashboard/hotel` |
| `routes/dashboard/admin/users/index.tsx` | `/dashboard/admin/users` |

`$hotelId` means “a number goes here” (like a slot in the URL).

When you add a route file and save, **`routeTree.gen.ts` updates automatically**. Don’t edit that file yourself.

---

## Two kinds of pages

### 1. Public visitor pages (no login needed)

- Home, browse hotels, book a room, island map
- Navbar at top (`SiteHeader`)
- Routes like `/`, `/hotels`, `/map`, `/my-bookings`

Feature folder: mostly **`hotel-browsing/`**, **`map-locations/`**

### 2. Staff / admin dashboard (login required)

- Hotel staff: `/dashboard/hotel/*`
- Admin: `/dashboard/admin/*`
- Sidebar layout (`app-shared.tsx`)

Feature folder: **`hotels/`**, **`users/`**, **`promotions/`**, etc.

Guards live in route files (`beforeLoad`) — they bounce you to `/login` if you’re not signed in.

---

## How data gets from backend to screen

```
Page component
    ↓ useSuspenseQuery(...)
queries.ts  (queryKey + queryFn)
    ↓
server.ts  (createServerFn → apiFetch)
    ↓
Backend API  (http://localhost:4000/api/v1/...)
```

**`server.ts`** runs on the **server** (during SSR), forwards your login cookies, and calls the backend.

**`queries.ts`** tells React Query: “fetch hotels, cache for 30 seconds, refetch when stale.”

**Pages** use `useSuspenseQuery(hotelsQueryOptions)` so data is ready when the screen paints.

---

## First-time setup

From the monorepo root (once):

```bash
cd tms
npm install
```

Optional — if backend isn’t on the default URL, create `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

(If you skip this, it defaults to that URL anyway.)

---

## Every-day commands

Run from **`apps/frontend`**:

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start the website (hot reload when you save) |
| `npm run build` | Build for production + TypeScript check |
| `npm run preview` | Preview the production build locally |

When dev works:

```
➜  Local:   http://localhost:3000/
```

If port 3000 is busy, Vite tries 3001, 3002, … — check the terminal for the real port.

**Important:** The backend must also be running, or login and data pages will fail. See [app-guid.md](./app-guid.md).

---

## Styling (how it looks)

| Thing | Where |
|-------|--------|
| Colours & theme | `src/styles/app.css` (`:root` = light, `.dark` = dark) |
| Glass cards | classes like `glass-marketing`, `glass-data`, `bg-card` |
| UI building blocks | `src/components/ui/` (shadcn — Button, Card, Dialog, …) |
| Icons | `lucide-react` (`<Hotel />`, `<Map />`, …) |
| Layout spacing | Tailwind classes (`px-4`, `py-16`, `max-w-7xl`) |

**Light/dark mode:** Toggle in the navbar. Theme is stored in `localStorage` under key `theme`.

**Images:** Put files in `public/images/…` and use `/images/hero/my-photo.jpg` in code.

---

## Main feature folders

| Folder | Who uses it | What it does |
|--------|-------------|--------------|
| `auth/` | Everyone | Login, signup, logout, “who am I?” |
| `hotel-browsing/` | Visitors | Home, browse hotels, book, my bookings |
| `hotels/` | Hotel staff | Dashboard, rooms, bookings, reports |
| `map-locations/` | Everyone + admin | Island map |
| `promotions/` | Admin + hotel staff | Discount codes |
| `advertisements/` | Admin | Homepage banners |
| `users/` | Admin | Manage staff accounts |
| `reports/` | Admin | Analytics charts |
| `audit-logs/` | Admin | Action history |

---

## Adding a new page (checklist)

1. **Create the screen** in `features/my-thing/pages/my-page.tsx`
2. **Add server + queries** if it needs backend data (`server.ts`, `queries.ts`)
3. **Add a route file** in `routes/my-path/index.tsx` that loads data and renders the page
4. **Add a link** somewhere (navbar, sidebar) so people can find it
5. **Refresh the browser** — route tree regenerates on dev save

Example route skeleton:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { MyPage } from "~/features/my-thing/pages/my-page";

export const Route = createFileRoute("/my-path/")({
  component: MyPage,
});
```

---

## Common problems

### Blank page / “failed to fetch”

→ Backend probably isn’t running. Start it: `cd apps/backend && npm run dev`

### Login works but dashboard is empty

→ Run `npm run db:seed` in backend. You need demo data.

### Wrong port / CORS errors

→ Frontend on 3001 but backend expects 3000? Either use port 3000 for frontend, or update backend `.env`:

```env
CORS_ORIGIN=http://localhost:3001
```

### `routeTree.gen.ts` looks wrong

→ Stop dev, delete `routeTree.gen.ts` if corrupted, run `npm run dev` again — it regenerates.

### Red squiggles on `@custom-variant` in `app.css`

→ That’s the editor not knowing Tailwind v4 syntax. The app still builds. See [issuesFaced.md](./issuesFaced.md).

### `npm run dev` from repo root fails instantly (Windows)

→ Use **two terminals** (frontend + backend separately). Details in [app-guid.md](./app-guid.md).

---

## Test accounts (after backend seed)

| Email | Password | Where to go |
|-------|----------|-------------|
| `hotel@example.com` | `ChangeMe123!` | `/dashboard/hotel` |
| `admin@example.com` | `ChangeMe123!` | `/dashboard/admin` |
| Sign up any email | your choice | `/signup` → visitor |

---

## Files worth bookmarking

| File | Why |
|------|-----|
| [app-guid.md](./app-guid.md) | Run frontend + backend together |
| [backend-guid.md](./backend-guid.md) | API & database |
| [hoteldomain.md](./hoteldomain.md) | Hotel tables, modules, and add-feature recipes |
| [frontend-guideline.md](../frontend-guideline.md) | Detailed patterns (for when you’re ready) |
| [development-guide.md](./development-guide.md) | Full monorepo reference |
| [issuesFaced.md](./issuesFaced.md) | Fixes we already found |

---

## One-sentence summary

**Routes pick the URL, features build the screen, server.ts calls the backend, and `npm run dev` shows it in your browser — but the kitchen (backend) must be running too.**
