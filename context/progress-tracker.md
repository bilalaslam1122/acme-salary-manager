# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 0, planning: complete. The work is waiting for approval to start Phase 1.

## Current Goal

- Get the spec (the six context files) approved, including answers to the Open
  Questions, before scaffolding.

## Completed

- [x] Phase 0: filled in all six context files (`docs: add project context and spec files`).

## In Progress

- None yet.

## Next Up

Each bullet is one verifiable unit and one commit.

- [ ] **Phase 1:** `chore:` Scaffold Next.js (App Router) with strict TS, Tailwind,
      shadcn/ui init, Prisma, Vitest + RTL, ESLint + Prettier, and the
      `dev`/`build`/`test`/`lint`/`db:*` scripts. Add `lib/env.ts`.
- [ ] **Phase 2:** `feat:` Prisma schema, the initial migration, and a deterministic
      10,000-employee seed (+ tests: count, determinism, currency/country
      consistency, and one history row per employee).
- [ ] **Phase 3:** `feat:` Employee service, the CRUD API (`/api/employees`,
      `/api/employees/[id]`), Zod schemas, and the error mapping (+ tests).
- [ ] **Phase 4:** `feat:` The list API with pagination, search, filters and sort,
      plus indexes (+ tests, including a performance smoke test at 10k).
- [ ] **Phase 5:** `feat:` The insights service and API: min, max, avg and median by
      group, headcount by country, histogram, and USD normalization (+ tests with
      hand-computed expectations).
- [ ] **Phase 6:** `feat:` SalaryHistory written in the same transaction on create
      and on salary change, plus the history API (+ tests, including rollback on
      failure).
- [ ] **Phase 7:** `feat:` HR Manager auth: seeded user, login and logout API, session
      cookie, and middleware (+ tests).
- [ ] **Phase 8:** `feat:` UI: the app shell, login page, and employee directory table
      with URL-driven filters.
- [ ] **Phase 9:** `feat:` UI: the create/edit employee sheet, terminate confirmation,
      and employee detail with history.
- [ ] **Phase 10:** `feat:` UI: the insights dashboard with stat cards and charts.
- [ ] **Phase 11:** `chore:` Polish the empty, error and loading states, verify the
      performance goals at 10k, and write the README.
- [ ] **Phase 12:** `chore:` Deploy, seed production, and write the demo script for
      the video.

## Open Questions

Each question states the working assumption the docs use until it is answered.

1. **SQLite locally and Postgres in production.** Prisma fixes the datasource provider
   in the schema, and migrations are provider-specific. That means two schema
   variants and two migration folders, and the SQL is only proven against Postgres at
   deploy time. *Recommendation:* use Postgres everywhere (Docker locally, a separate
   test database). *Assumption until answered:* follow the stated stack (SQLite for
   dev and tests), keep all raw SQL portable (Invariant 8), and add a Postgres smoke
   test in Phase 12.
2. **What does "delete" mean?** *Assumption:* terminate is a soft delete
   (`terminatedAt`). The employee is excluded from insights and hidden from the
   directory by default, and their history is kept. No hard delete exists.
3. **Salary currency.** *Assumption:* salary is always paid in the employee's country
   currency. Contractors paid in USD abroad are not modelled.
4. **Salary basis.** *Assumption:* annual gross base salary, full-time. No FTE or
   part-time proration.
5. **Job titles.** *Assumption:* a free-text column chosen from the seeded set of
   about 15 titles, which the UI shows as a combobox. It is not a separate table.
   Promote it to a table if the HR Manager needs to manage titles.
6. **Countries and FX.** *Assumption:* 8 countries (US, GB, DE, FR, IN, CA, JP, SG)
   with 7 currencies, and one FX version (`2026-10`). Adding countries or rates goes
   through a migration or seed. The app has no admin UI for them.
7. **Deploy target.** *Assumption:* Vercel + Neon Postgres. The alternative is
   Railway, which would host both the app and the database.
8. **Histogram buckets.** *Assumption:* 20 equal-width buckets in USD between the
   filtered min and max, rounded to a multiple of $5k.

## Architecture Decisions

- **AD-1: Money is stored as integer minor units plus a currency code.**
  *Why:* it avoids float rounding and stays exact in aggregation.
  *Alternatives:* Prisma `Decimal` behaves differently on SQLite and Postgres, and
  floats are lossy.
  *Trade-off:* a 32-bit Int on Postgres caps a value at about 2.1B minor units. That
  is enough for the chosen currencies (INR 10M = 1B paise). A currency like IDR
  would need `BigInt`.
- **AD-2: Static, versioned FX table, with rates stored as `usdPerUnitMicros`.**
  *Why:* results are reproducible and testable, and each result is labelled with its
  version.
  *Alternatives:* a live FX API (non-deterministic, external dependency) or one rate
  per currency without versions (no audit trail).
  *Trade-off:* rates go stale and need a manual update.
- **AD-3: All aggregation runs in SQL through `$queryRaw` in `lib/db/insights.ts`.**
  *Why:* the work runs in O(1) round trips and the database does what it is good at.
  Prisma `groupBy` cannot compute a median or join FX.
  *Alternatives:* load 10k rows into JS. That is simple, but it violates Invariant 2
  and does not scale.
  *Trade-off:* the raw SQL must stay portable, so it gets integration tests.
- **AD-4: Median uses portable window functions.**
  `ROW_NUMBER() OVER (PARTITION BY g ORDER BY usd)` and `COUNT(*) OVER (PARTITION BY g)`
  select the middle row, or the middle two rows averaged. This works on SQLite 3.25+
  and Postgres.
  *Alternatives:* `percentile_cont` (Postgres only) or computing the median in JS.
  *Trade-off:* the query is more verbose, at O(n log n) per group, which is trivial at
  10k.
- **AD-5: Offset pagination (`page`, `pageSize` ≤ 100) with `COUNT(*)`.**
  *Why:* the HR Manager needs to jump to a page and see a total. At 10k rows, OFFSET
  costs under 10 ms.
  *Alternatives:* cursor or keyset pagination scales better but cannot jump to a page.
  Revisit it past about 1M rows.
- **AD-6: Search uses a denormalized lowercase `searchText` column with `LIKE '%q%'`.**
  *Why:* it is case-insensitive in the same way on SQLite and Postgres. Prisma's
  `mode: 'insensitive'` is not supported on SQLite.
  *Trade-off:* a leading wildcard cannot use an index, so it does a full scan. That
  takes about 5–15 ms at 10k. `pg_trgm` is the upgrade path. The service keeps the
  column in sync on every write.
- **AD-7: Indexes on the filter and sort columns.** The indexes are `countryCode`,
  `departmentId`, `jobTitle`, `(lastName, firstName)`, `hireDate`, `terminatedAt`,
  and `SalaryHistory(employeeId, changedAt)`. Sorting by USD salary is computed
  through the FX join and is not indexed, which is acceptable at 10k and is verified
  in Phase 11.
  *Alternative:* a denormalized `salaryUsd` column. It is fast, but it goes stale when
  the FX version changes.
- **AD-8: Deterministic seed.** It uses `faker.seed(42)` and a fixed reference date.
  Salaries come from a band per title, a multiplier per country, and a seeded
  log-normal jitter. Rows are inserted with `createMany` in batches of 1,000 inside a
  transaction. The history rows are created from the same generated data, using
  deterministic ids.
  *Target:* under 10 s on SQLite.
  *Alternative:* row-by-row `create`. It is far slower, about 10k round trips.
- **AD-9: Stateless JWT session cookie (`jose`) and bcrypt.**
  *Why:* one user, no session table, and it works in Edge middleware.
  *Alternatives:* NextAuth or Auth.js are heavier than one seeded login needs, and DB
  sessions add a table.
  *Trade-off:* a token cannot be revoked before it expires (8 h).
- **AD-10: Server components call services directly, and client components mutate
  through `app/api`.**
  *Why:* there is no extra HTTP hop on reads, and one validated mutation path.
  *Alternative:* Server Actions. They were rejected because the assessment values an
  explicit, testable REST API.
- **AD-11: Integer autoincrement primary keys plus a unique `employeeCode`.**
  *Why:* they are simple, index-friendly and seed deterministically.
  *Trade-off:* the ids are enumerable, which is acceptable for a single-tenant
  internal tool behind auth.

## AI Prompts Log

| # | Date | Prompt (summary) | Output review / corrections |
| - | ---- | ---------------- | --------------------------- |
| 1 | 2026-10-26 | "You are a senior full-stack engineer… fill in all six context files (project overview, architecture, code standards, UI context, AI workflow rules, progress tracker) for an ACME salary manager; planning only, no app code; commit `docs: add project context and spec files`." | Reviewed against the brief. The AI raised these issues instead of silently picking an answer: the SQLite/Postgres provider split (Q1), the delete semantics (Q2), the 32-bit Int overflow risk for minor units (AD-1), and the absence of `percentile_cont` on SQLite, which led to a portable window-function median (AD-4). |

## Session Notes

- 2026-10-26: The repo started empty, apart from the context templates provided in
  chat, so they were created under `context/`. No app code exists yet. Next session:
  read all six files, apply the answers to the Open Questions, then start Phase 1.
