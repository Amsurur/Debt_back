# Debt Tracker API

A REST API backend for tracking debts — who owes you, who you owe, organized by
contacts and folders, with partial payments and a dashboard summary.

Built with **Node.js + TypeScript + Express + PostgreSQL** (raw SQL via `pg`, no ORM).
Auth uses **JWT access + refresh tokens** with refresh-token rotation.

---

## Features

- Register / login with hashed passwords (bcrypt)
- Access token (short-lived) + refresh token (long-lived, rotated & revocable)
- Folders to group contacts
- Contacts (people involved in debts)
- Debts (`they_owe_me` / `i_owe_them`), with currency, due date, and status
- Payments against a debt — status auto-updates to `pending` / `partial` / `paid`
- Dashboard summary: totals, outstanding balances, net balance, status counts, upcoming due
- Input validation (Zod), security headers (helmet), CORS, request logging (morgan)

## Tech stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Language       | TypeScript                      |
| Web framework  | Express 4                       |
| Database       | PostgreSQL via `pg` (raw SQL)   |
| Auth           | JWT (access + refresh) + bcrypt |
| Validation     | Zod                             |
| Dev runner     | tsx                             |

## Project structure

```
src/
  config/      env loading + pg pool & query helpers
  db/          schema.sql + migration runner
  middleware/  auth (JWT), validation (Zod), error handler
  utils/       AppError, asyncHandler, password, jwt
  modules/
    auth/      register, login, refresh, logout
    users/     current user profile
    folders/   CRUD
    contacts/  CRUD
    debts/     CRUD + payments
    dashboard/ summary aggregates
  app.ts       express app (middleware + routes)
  server.ts    entry point
```

Each module is layered: **routes → controller → service → db**. Routes wire up
middleware, controllers handle HTTP, services hold the SQL and business logic.

---

## Local setup

**Requirements:** Node.js 18+ and a PostgreSQL database.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create your `.env`** (copy the example and fill it in)

   ```bash
   cp .env.example .env
   ```

3. **Generate JWT secrets** and paste them into `.env`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Run it twice — once for `ACCESS_TOKEN_SECRET`, once for `REFRESH_TOKEN_SECRET`.

4. **Set `DATABASE_URL`** in `.env` to your Postgres connection string. To create a
   local database:

   ```bash
   createdb debt_tracker
   ```

5. **Run the migration** (creates all tables — safe to run repeatedly):

   ```bash
   npm run migrate
   ```

6. **Start the dev server** (auto-reloads on changes):

   ```bash
   npm run dev
   ```

   Visit `http://localhost:4000/health` — you should get `{ "status": "ok" }`.

There's an `api.http` file with ready-made sample requests (use the VS Code
**REST Client** extension), so you can demo every endpoint quickly.

### Environment variables

| Variable               | Required | Default       | Notes                                            |
| ---------------------- | -------- | ------------- | ------------------------------------------------ |
| `DATABASE_URL`         | yes      | —             | Postgres connection string                       |
| `ACCESS_TOKEN_SECRET`  | yes      | —             | Long random string                               |
| `REFRESH_TOKEN_SECRET` | yes      | —             | Long random string (different from access)       |
| `PORT`                 | no       | `4000`        | Server port                                      |
| `NODE_ENV`             | no       | `development` | `production` hides error details                 |
| `PGSSL`                | no       | `false`       | Set `true` on managed Postgres that needs SSL    |
| `ACCESS_TOKEN_TTL`     | no       | `15m`         | e.g. `15m`, `1h`                                 |
| `REFRESH_TOKEN_TTL`    | no       | `7d`          | e.g. `7d`, `30d`                                 |
| `CORS_ORIGIN`          | no       | `*`           | `*` or comma-separated origins                   |

### Scripts

| Command               | What it does                                  |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Start with hot reload (tsx)                   |
| `npm run migrate`     | Apply `schema.sql` to the database            |
| `npm run build`       | Compile TypeScript to `dist/`                 |
| `npm start`           | Run the compiled server (`dist/server.js`)    |
| `npm run migrate:prod`| Run migration from compiled output            |

---

## API reference

Interactive Swagger UI is available at **`http://localhost:4000/docs`** (raw OpenAPI 3.0 spec at `/docs.json`). Use the **Authorize** button to paste an `accessToken` and try authenticated routes directly from the browser.

Base path: `/api`. All routes except `/health` and `/api/auth/*` require a header:

```
Authorization: Bearer <accessToken>
```

### Auth

| Method | Path                 | Body                          | Notes                          |
| ------ | -------------------- | ----------------------------- | ------------------------------ |
| POST   | `/api/auth/register` | `name, email, password`       | Returns `user` + tokens        |
| POST   | `/api/auth/login`    | `email, password`             | Returns `user` + tokens        |
| POST   | `/api/auth/refresh`  | `refreshToken`                | Rotates: old token is revoked  |
| POST   | `/api/auth/logout`   | `refreshToken`                | Revokes the refresh token      |

### Users

| Method | Path            | Body   | Notes               |
| ------ | --------------- | ------ | ------------------- |
| GET    | `/api/users/me` | —      | Current user        |
| PATCH  | `/api/users/me` | `name` | Update display name |

### Folders

| Method | Path               | Body            |
| ------ | ------------------ | --------------- |
| GET    | `/api/folders`     | —               |
| POST   | `/api/folders`     | `name, color?`  |
| GET    | `/api/folders/:id` | —               |
| PATCH  | `/api/folders/:id` | `name?, color?` |
| DELETE | `/api/folders/:id` | —               |

### Contacts

| Method | Path                | Body                                       |
| ------ | ------------------- | ------------------------------------------ |
| GET    | `/api/contacts`     | — (optional query `?folder_id=`)           |
| POST   | `/api/contacts`     | `name, phone?, email?, note?, folder_id?`  |
| GET    | `/api/contacts/:id` | —                                          |
| PATCH  | `/api/contacts/:id` | any of the above fields                    |
| DELETE | `/api/contacts/:id` | —                                          |

### Debts

| Method | Path                       | Body                                                                          |
| ------ | -------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/api/debts`               | — (filters: `?status=&contact_id=&direction=`)                               |
| POST   | `/api/debts`               | `contact_id, direction, amount, currency?, description?, due_date?`          |
| GET    | `/api/debts/:id`           | —                                                                            |
| PATCH  | `/api/debts/:id`           | any debt field + `status`                                                    |
| DELETE | `/api/debts/:id`           | —                                                                            |
| GET    | `/api/debts/:id/payments`  | —                                                                            |
| POST   | `/api/debts/:id/payments`  | `amount, note?, paid_at?` → adds payment and recomputes debt status          |

- `direction` is `they_owe_me` or `i_owe_them`
- `status` is `pending`, `partial`, or `paid` (auto-managed by payments)
- `due_date` is `YYYY-MM-DD`

### Dashboard

| Method | Path                     | Returns                                                            |
| ------ | ------------------------ | ----------------------------------------------------------------- |
| GET    | `/api/dashboard/summary` | totals, outstanding (incl. `net_balance`), status counts, upcoming |

Every resource is scoped to the authenticated user — you can only read or modify
your own data.

---

## Deployment

The database schema is idempotent (`CREATE TABLE IF NOT EXISTS ...`), so running
the migration on every deploy is safe.

### Render (one-click via Blueprint)

This repo includes `render.yaml`. In the Render dashboard choose
**New + → Blueprint** and select the repo. It will:

- create a free PostgreSQL database,
- create the web service,
- generate `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` automatically,
- wire `DATABASE_URL` from the database,
- build with `npm install && npm run build`,
- start with `npm run migrate:prod && npm start`.

### Railway

1. Create a new project → **Provision PostgreSQL**.
2. **Deploy from GitHub repo** (Railway auto-detects Node).
3. In the service **Variables**, add: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`,
   `NODE_ENV=production`, `PGSSL=true`. Railway provides `DATABASE_URL` automatically
   when you link the Postgres plugin (reference it as `${{Postgres.DATABASE_URL}}`).
4. Set commands (Settings → Deploy):
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run migrate:prod && npm start`

---

## Notes

- **Currency:** defaults to `USD`. To change the default (e.g. to `TJS`), edit the
  `DEFAULT 'USD'` in `src/db/schema.sql` and the `.default('USD')` in
  `src/modules/debts/debts.schema.ts`. Each debt can still set its own currency.
- **Money precision:** `NUMERIC` values are parsed into JS numbers for convenience
  (see `src/config/db.ts`). That's fine for an app like this; for banking-grade
  precision you'd keep them as strings and use a decimal library.
- **Refresh tokens** are stored as rows (one per token) so they can be rotated and
  revoked. Logging out or refreshing revokes the old token.
