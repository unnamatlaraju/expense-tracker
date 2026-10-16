# Spendly · Personal Expense Tracker

A full-stack Next.js app for tracking daily expenses, category budgets and recurring commitments — bills, EMIs and subscriptions.

Data lives in **PostgreSQL** behind a REST API, and every request is scoped to the signed-in user.
The UI uses a dark "Aurora Glass" theme: translucent glass cards, purple → pink → orange gradients and animated background glows. Desktop has a sidebar; phones get a bottom tab bar.

## Features

- **Accounts**: email/password sign-up and sign-in. Sessions are signed JWTs in an httpOnly cookie; passwords are hashed with bcrypt.
- **Expenses** (`/`): add expenses with a description, amount (₹), category and date. You can mark an expense as recurring and add your own categories.
- **Add by voice**: tap the mic on the Expenses page and say something like "I spent 1000 on rent" or "200 for snacks yesterday". The app picks out the amount, category, date and description, and shows a preview you confirm before anything is saved. Speech-to-text uses the browser's built-in Web Speech API (Chrome, Edge, Safari; not Firefox), and the glow is [`voice-glow`](https://libraries.dev/voice.html). The mic needs `https` or `localhost`. You can type the sentence instead.
- **Summary** (`/summary`): total and this-month spending, a pie chart by category and a monthly bar chart.
- **Budget** (`/budget`): set a spending limit per category and track progress against it.
- **Commitments** (`/commitments`): the bills, EMIs and subscriptions you pay on a schedule. Each one shows as *overdue*, *due today*, *due soon* or *upcoming*, and "Mark paid" logs the expense and moves the due date forward in a single transaction. It is **idempotent** — double-clicking (or a retried request) can never log the same period twice. You can also **Skip** a period without logging anything (so a missed month doesn't inflate your history), pause/resume, edit, or delete. An optional **last due date** makes a commitment retire itself once a plan ends, and reminder preferences (how many days ahead) are stored per commitment.
- **Reports** (`/reports`): filter by date range and category, then export to CSV or to an HTML report.

## Security & correctness

A few things that are easy to get wrong are handled explicitly:

- **Rate limiting** on `signup` and `login`, backed by a Postgres table rather than memory, because process-local counters don't limit anything across serverless instances. Login is limited per IP *and* per account, so a distributed attack on one account is still throttled. Exceeding a limit returns `429` with a `Retry-After` header.
- **Passwords** are hashed with bcrypt, and unknown emails still pay the hashing cost so response time doesn't reveal which accounts exist.
- **Input validation** (Zod) bounds amounts to fit the `Decimal(12, 2)` columns, rejects non-existent dates like `2026-02-31`, and rounds money to 2 decimals before it reaches the database.
- **Category names** are unique per user case-insensitively, enforced by a database index rather than an application check (which has a race window).
- **Every query is scoped to the signed-in user**, so one account cannot read or mutate another's data.
- **Partial updates** only write the fields a request actually sends: the Zod schemas strip unknown keys, so a client can't smuggle a `userId` or `id` into a `PATCH` and move a row into another account.
- **Timezones**: the server computes a user's "today" from their stored IANA timezone, not the server clock, so dates don't drift for users far from the host region.
- **Exports** escape user text before building HTML.

## Tests

```bash
npm test          # run once
npm run test:watch
```

Vitest covers the pure logic where bugs hide quietly: amount/date validation, timezone-aware date maths (including month-end clamping, e.g. `Jan 31` + 1 month = `Feb 28`), commitment due-date status and advancement, and the voice parser.

## Getting started

Requires Node.js 20 or later and a PostgreSQL database.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start a database.** With Docker:

   ```bash
   docker compose up -d
   ```

   Or point `DATABASE_URL` at any Postgres (Neon, Supabase, …).

3. **Configure environment.** Copy the example and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string used by the app (a pooled/PgBouncer URL is fine) |
   | `DIRECT_URL` | Direct (non-pooled) connection used by `prisma migrate` / `prisma db push` |
   | `AUTH_SECRET` | Signs session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

4. **Create the tables and run the app**

   ```bash
   npm run db:deploy   # apply the migrations in prisma/migrations
   npm run dev
   ```

   Open http://localhost:3000 and create an account.

   To change the schema, edit `prisma/schema.prisma` and run `npm run db:migrate`. That command needs permission to create a temporary *shadow* database on the server (the direct connection usually has it). If your host doesn't, diff the schema instead and apply the result with `npm run db:deploy`.

## Migrations

The schema is versioned in `prisma/migrations/`: `0_init` is the original baseline and each later migration is a small, reviewable step. `npm run db:deploy` applies pending migrations and is what a deploy should run — it never resets data. `npm run db:push` (schema push without history) is still there for quick local experiments, but migrations are the source of truth.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript type check |
| `npm test` | Run the unit tests (Vitest) |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run db:push` | Apply the Prisma schema to the database (no migration history) |
| `npm run db:migrate` | Create and apply a versioned migration |
| `npm run db:deploy` | Apply pending migrations (use this on deploy) |
| `npm run db:studio` | Browse the data in Prisma Studio |

## Project structure

| Path | What's in it |
| --- | --- |
| `app/(app)/` | Authenticated pages: `page.tsx` (expenses), `summary/`, `budget/`, `commitments/`, `reports/` |
| `app/(auth)/` | Public pages: `login/`, `signup/` |
| `app/api/` | REST API route handlers (see below) |
| `components/app-shell.tsx` | Sidebar, mobile top bar, bottom tab bar and account menu |
| `components/views/` | The content of each page |
| `components/ui/` | Base shadcn/ui components, restyled for the theme |
| `lib/store.tsx` | Client data store (`useExpenseStore`). Every mutation calls the API |
| `lib/api.ts`, `lib/serialize.ts` | Response helpers and Prisma → JSON conversion |
| `lib/auth/` | `session.ts` (JWT sign/verify), `cookies.ts` (cookie + `getSession`), `password.ts` (bcrypt) |
| `lib/validation.ts` | Zod schemas shared by the API |
| `lib/rate-limit.ts` | Postgres-backed rate limiter for the auth routes |
| `lib/commitments.ts` | Due-date status, advancement and monthly-cost maths (pure, unit tested) |
| `lib/*.test.ts` | Vitest unit tests (`vitest.config.mts`) |
| `prisma/schema.prisma` | Database schema |
| `prisma/migrations/` | Versioned SQL migrations |
| `middleware.ts` | Redirects unauthenticated visitors to `/login` |
| `lib/voice-parse.ts` | Turns a spoken sentence into amount, category, date and description |
| `components/voice-add.tsx` | The voice card: mic button, glow, and confirm step |

## API

All routes are under `/api` and require a session cookie. Data is always filtered by the authenticated user.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account (seeds default categories). Rate limited |
| `POST` | `/api/auth/login` | Sign in. Rate limited per IP and per account |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/me` | Current user, or `null` |
| `PATCH` | `/api/auth/me` | Update the current user's settings (timezone) |
| `GET` | `/api/bootstrap` | Everything the client needs: user, expenses, categories, budgets, commitments |
| `POST` | `/api/expenses` | Add an expense (also creates the commitment when a repeat is set) |
| `DELETE` | `/api/expenses/:id` | Delete an expense |
| `POST` | `/api/categories` | Add a category |
| `PUT` | `/api/budgets` | Create or update a category budget |
| `POST` | `/api/commitments` | Add a commitment |
| `PATCH` | `/api/commitments/:id` | Update, pause or resume a commitment |
| `DELETE` | `/api/commitments/:id` | Delete a commitment |
| `POST` | `/api/commitments/:id/process` | Log this period and advance the due date (idempotent per period) |
| `POST` | `/api/commitments/:id/skip` | Advance the due date without logging an expense |

## Tech stack

Next.js 15 (App Router, route handlers, middleware), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Recharts, lucide-react, PostgreSQL, Prisma, Zod, jose, bcrypt.
