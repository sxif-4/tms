# Issues Faced & Fixes — Funisland Frontend Development

A running log of problems encountered while building the Funisland monorepo frontend and the resolutions applied.

---

## 1. Backend fails to start — `JWT_SECRET` is required

**When:** First attempt to run `npm run dev` from the backend.

**Error:**
```
[Nest] ERROR [ExceptionHandler] Error: Config validation error: "JWT_SECRET" is required
```

**Cause:** The NestJS app uses `@nestjs/config` with Joi validation. No `.env` file existed in `apps/backend/`.

**Fix:** Created `apps/backend/.env` with the required variables:
```env
JWT_SECRET=funisland-dev-secret-key-minimum-32-chars-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin1234!
NODE_ENV=development
```

---

## 2. Backend starts but crashes — `no such table: users`

**When:** Backend started after the `.env` fix but crashed on first request.

**Error:**
```
SqliteError: no such table: users
```

**Cause:** The SQLite database had not been initialised — no migrations or seed data existed yet.

**Fix:** Ran the Drizzle migration and seed scripts from `apps/backend/`:
```bash
npm run db:migrate
npm run db:seed
```

This created the schema and populated the initial `admin` and `hotel_staff` seed accounts.

---

## 3. `vite` not found when running build/dev

**When:** First attempt to run `npm run build` directly from `apps/frontend/`.

**Error:**
```
'vite' is not recognized as an internal or external command
```

**Cause:** `vite` is listed in `devDependencies` but npm workspaces hoist it to the root `tms/node_modules`. The `apps/frontend/node_modules/.bin/` directory is empty, so `vite` is not on the PATH in that context.

**Fix:** Changed the scripts in `apps/frontend/package.json` to use an explicit relative path to the vite binary instead of relying on PATH resolution:
```json
"dev":     "node ../../node_modules/vite/bin/vite.js dev",
"build":   "node ../../node_modules/vite/bin/vite.js build && tsc --noEmit",
"preview": "node ../../node_modules/vite/bin/vite.js preview"
```

---

## 4. `npx turbo dev` reports `Failed: frontend#dev` immediately (~600 ms)

**When:** Running `npm run dev` from the monorepo root (which calls `turbo run dev`).

**Symptoms:**
- Turbo exits with `Failed: frontend#dev` after ~600 ms.
- No vite output is shown.
- Running `npm run dev` directly from `apps/frontend/` works fine.
- Running the exact npm command that turbo uses manually also works fine.

**Cause:** Turborepo 2.x has a Windows-specific bug with `"persistent": true` tasks. When turbo spawns `npm run dev` it attaches to the process group for signal forwarding, but on Windows this causes it to incorrectly kill the vite child process before it finishes starting. The exit code appears as `1` to turbo even though vite would have started successfully if left alone.

**Fix:** Bypassed turbo for the `dev` script entirely in the root `package.json`, using npm workspaces' native parallel execution instead:

`tms/package.json` — before:
```json
"dev": "turbo run dev"
```

After:
```json
"dev": "npm run dev -w apps/frontend -w apps/backend"
```

Turbo is still used for `build`, `lint`, and `check-types` where it works correctly.

Additionally changed `turbo.json` UI mode from `"tui"` to `"stream"` to prevent the interactive TUI from hiding error output in VS Code terminals:
```json
"ui": "stream"
```

---

## 5. `turbo dev --filter=frontend` silently shows nothing in the TUI

**When:** Running `npx turbo dev --filter=frontend` in the VS Code integrated terminal.

**Symptoms:** The Turborepo TUI collapses persistent task output, showing only the task name and `Failed` with no details visible.

**Cause:** `"ui": "tui"` in `turbo.json` enables the interactive terminal UI which requires a true TTY. The VS Code integrated terminal does not provide a full TTY, so the TUI renders incorrectly and swallows output.

**Fix:** Already covered by the change to `"ui": "stream"` in issue #4 above.

---

## How to Run

From the monorepo root (`tms/`):

```bash
# Install all dependencies (first time only)
npm install

# Start both servers in parallel
npm run dev
```

- Frontend: `http://localhost:3000` (or 3001 if 3000 is occupied)
- Backend API: `http://localhost:3001/api`

**Test accounts:**
| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `Admin1234!` | admin |
| `hotel@example.com` | `Hotel1234!` | hotel_staff |
| Any registered email | chosen at signup | visitor |


PORT=4000
NODE_ENV=development

DATABASE_PATH=./data/dev.db

# Frontend origin allowed to send credentialed (cookie) requests.
CORS_ORIGIN=http://localhost:3000

# Dev-only secret. Generate a fresh one for any real deployment:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=dev_only_change_me_4f8c2a1b9e7d6c5a3f2e1d0c9b8a7654
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_ISSUER=booking-system
JWT_AUDIENCE=booking-system-clients

# Seed-only credentials for the initial admin account.
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!

# Backend API base URL (used by the browser and the SSR server)
VITE_API_URL=http://localhost:4000/api/v1