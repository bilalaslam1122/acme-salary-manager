# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 3, employee service and CRUD API: complete. Phase 4 is next.

## Current Goal

- Phase 4: the list API with pagination, search, filters, sort and indexes, with
  tests.

## Completed

- [x] Phase 0: filled in all six context files (`docs: add project context and spec files`).
- [x] Phase 0: resolved the open questions and switched to Postgres everywhere
      (`docs: resolve open questions and adopt postgres everywhere`).
- [x] Phase 1: scaffolded Next.js 16, strict TS, Tailwind v4 with the project tokens,
      shadcn/ui (radix-nova), Prisma 7 + the pg adapter, Vitest (`unit` and
      `component` projects), ESLint + Prettier, and the scripts. `lib/env.ts` is
      Zod-validated with tests. `lint`, `typecheck`, `test` and `build` all pass.
- [x] Phase 2: Prisma schema (snake_case tables, indexes per AD-7) and the `init`
      migration. The deterministic seed creates 10,000 employees, 22,950 salary
      history rows, 8 countries, 9 departments, 15 titles and 7 FX rates. It runs in
      4.4 s locally, and two runs give byte-identical data (md5 of every row).
      Tests: 10 unit tests on the generator, 4 integration tests on the writer, and
      a Vitest `integration` project against `acme_salary_test`.
- [x] Phase 3:
      - Employee service with create, get, update and terminate.
      - SalaryHistory is written in the same transaction on create and on salary or
        currency change, with a row lock against concurrent edits.
      - `POST /api/employees` and `GET`/`PATCH`/`DELETE /api/employees/[id]`.
      - Zod schemas, domain errors, and the shared `handle()` error mapping.
      - Migration `add_old_currency_to_salary_history`.
      - 47 new tests: unit tests for validation and HTTP mapping, integration tests
        for the service and route handlers. A mutation check confirmed that removing
        the history write fails 2 tests.

## In Progress

- None yet.

## Next Up

Each bullet is one verifiable unit and one commit.

- [x] **Phase 1:** `chore:` Scaffold Next.js (App Router) with strict TS, Tailwind,
      shadcn/ui init, Prisma, Vitest + RTL, ESLint + Prettier, and the
      `dev`/`build`/`test`/`lint`/`db:*` scripts. Add `lib/env.ts`.
- [x] **Phase 2:** `feat:` Prisma schema, the initial migration, and a deterministic
      10,000-employee seed (+ tests: count, determinism, currency/country
      consistency, and one history row per employee).
- [x] **Phase 3:** `feat:` Employee service, the CRUD API (`/api/employees`,
      `/api/employees/[id]`), Zod schemas, and the error mapping (+ tests).
- [ ] **Phase 4:** `feat:` The list API with pagination, search, filters and sort,
      plus indexes (+ tests, including a performance smoke test at 10k).
- [ ] **Phase 5:** `feat:` The insights service and API: min, max, avg and median by
      group, headcount by country, histogram, and USD normalization (+ tests with
      hand-computed expectations).
- [ ] **Phase 6:** `feat:` The salary history read API
      (`GET /api/employees/[id]/history`, newest first, paginated) plus explicit
      rollback tests. The transactional write moved into Phase 3, so Invariant 5
      holds from the first salary write.
- [ ] **Phase 7:** `feat:` HR Manager auth: seeded user, login and logout API, session
      cookie, and `proxy.ts` (+ tests).
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

Phase 3 added these, each implemented as the stated assumption. Each needs
confirmation:

9. **Employee code:** server-generated as `ACME-{id:05}`. HR cannot enter their
   existing codes from Excel. Changing this would be a small, additive change if
   needed.
10. **Terminated employees are read-only.** Editing or re-terminating one returns 409,
    and no reinstate action exists.
11. **Hire date:** any valid calendar date is accepted, including a future date for
    planned hires. No other restriction is defined.
12. **Salary change reason:** optional, and only allowed when the salary actually
    changes (otherwise 400).

Resolved:

- All of the original questions were resolved on 2026-10-26, when the user approved
  the recommendations:
  1. **Database:** Postgres everywhere, in dev, test and prod (AD-12). Locally this is
     any Postgres 15+ (Homebrew or Docker), with a separate `_test` database.
  2. **Delete:** terminate is a soft delete (`terminatedAt`). The employee is excluded
     from insights and hidden from the directory by default, and their history is
     kept. No hard delete exists.
  3. **Salary currency:** always the employee's country currency.
  4. **Salary basis:** annual gross base salary, full-time. No FTE proration.
  5. **Job titles:** a free-text column chosen from the seeded set of about 15 titles,
     shown as a combobox. It is not a separate table.
  6. **Countries and FX:** 8 countries (US, GB, DE, FR, IN, CA, JP, SG) with 7
     currencies, and one FX version (`2026-10`). The app has no admin UI for them.
  7. **Deploy target:** Vercel + Neon Postgres.
  8. **Histogram:** 20 equal-width USD buckets between the filtered min and max,
     rounded to a multiple of $5k.

## Architecture Decisions

- **AD-1: Money is stored as integer minor units plus a currency code.**
  *Why:* it avoids float rounding and stays exact in aggregation.
  *Alternatives:* Prisma `Decimal` (a `Decimal.js` object, which is awkward to
  serialise and to use in arithmetic) and floats (lossy).
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
  *Trade-off:* raw SQL is not type-checked by Prisma, so every query gets integration
  tests with hand-computed expectations.
- **AD-4: Median uses `percentile_cont(0.5) WITHIN GROUP (ORDER BY usd)`.**
  *Why:* it is native, exact (it averages the middle two values), and works in the same
  `GROUP BY` as min, max and avg, so all of them come from one query.
  *Alternatives:* portable `ROW_NUMBER()` window functions were only needed while
  SQLite was in the stack. Computing the median in JS would violate Invariant 2.
  *Trade-off:* the median needs a sort per group, O(n log n), which is trivial at 10k.
- **AD-5: Offset pagination (`page`, `pageSize` ≤ 100) with `COUNT(*)`.**
  *Why:* the HR Manager needs to jump to a page and see a total. At 10k rows, OFFSET
  costs under 10 ms.
  *Alternatives:* cursor or keyset pagination scales better but cannot jump to a page.
  Revisit it past about 1M rows.
- **AD-6: Search uses a case-insensitive `contains` (`ILIKE '%q%'`) on first name,
  last name, email and employee code.** This is Prisma `mode: 'insensitive'`.
  *Why:* it is the simplest correct option, with no denormalized column to keep in
  sync.
  *Trade-off:* a leading wildcard cannot use a B-tree index, so it does a full scan.
  That takes about 5–15 ms at 10k and is verified in Phase 4. The upgrade path is a
  `pg_trgm` GIN index.
  *Alternative:* a lowercase `searchText` column was only needed for SQLite.
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
  *Target:* under 10 s against local Postgres.
  *Alternative:* row-by-row `create`. It is far slower, about 10k round trips.
- **AD-9: Stateless JWT session cookie (`jose`) and bcrypt.**
  *Why:* one user, no session table, and `jose` runs anywhere, including `proxy.ts`.
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
- **AD-12: Postgres everywhere (dev, test and prod) instead of SQLite in dev and
  Postgres in prod.**
  *Why:* Prisma fixes the provider in the schema and migrations are provider-specific,
  so a split would mean two schemas and two migration histories. It would also mean
  tests prove behaviour on a database that prod does not run. One engine lets us use
  `percentile_cont` and `ILIKE`.
  *Trade-off:* contributors need a local Postgres (Homebrew or Docker), and tests are
  slightly slower than with SQLite in-process.
  *Isolation:* a dedicated test database, truncated between tests, with integration
  files run sequentially.
- **AD-13: Toolchain versions as scaffolded (2026-10-26).**
  - Next.js 16.4 keeps the template defaults `cacheComponents` and
    `partialPrefetching`, so data is dynamic unless it is marked `use cache`. Auth
    lives in `proxy.ts`, Next 16's name for middleware.
  - Prisma 7 needs a driver adapter (`@prisma/adapter-pg`) and `prisma.config.ts`.
    The client is generated into `lib/db/generated/` (gitignored, regenerated on
    `postinstall`) instead of `app/`, so that `lib/db` owns all database access.
  - shadcn uses the `radix-nova` preset, which brings Lucide and Geist. Its `cn`
    helper comes from the official `cn` package (shadcn-ui org) instead of
    `clsx` + `tailwind-merge`.
  - Vitest 4 uses native `resolve.tsconfigPaths`, so the `vite-tsconfig-paths` plugin
    was dropped. `server-only` is aliased to an empty module in tests.
  *Trade-off:* these are recent majors, so the bundled docs in
  `node_modules/next/dist/docs` are the reference, not memory.
- **AD-14: The seed uses explicit ids, then resets the sequences.** Ids are assigned
  in the generator (1..n), so history rows can reference employees without a
  read-back. Afterwards `setval` moves each serial sequence past the maximum id.
  *Alternative:* `createManyAndReturn` with id mapping. It returns rows in insert
  order, but Postgres does not guarantee that order, which risks wrong FK links.
- **AD-15: `SalaryHistory.changedById` is nullable (null = system).** The seeded
  history predates the HR Manager user, which is created in Phase 7.
  *Alternative:* a fake "system" user row. It would pollute the users table and the
  single-user auth model.
- **AD-16: Seed salary model.** Salary = the title's US base × the country's pay
  multiplier × a log-normal jitter (σ 0.15, clamped to 0.6–1.6). It is converted to
  local currency at the seeded FX rate and rounded to 100 major units (INR 1,000,
  JPY 10,000). The history is 0–3 past raises of 3–12%, back-computed so that the
  chain ends exactly at the current salary.
- **AD-17: `SalaryHistory.oldCurrency`.** When an employee moves country, the old and
  new amounts are in different currencies. A single `currency` column would make the
  audit row wrong.
  *Alternatives:* forbid country moves (unrealistic), or write two rows (confusing).
- **AD-18: Concurrency on salary edits.** `updateEmployee` takes
  `SELECT … FOR UPDATE` on the employee row inside the transaction, so two concurrent
  edits cannot both record the same "old" salary.
  *Trade-off:* one extra round trip per update, which is negligible.
- **AD-19: Employee ids are reserved with `nextval()` before insert.** The code
  `ACME-{id}` is then written in the same INSERT, with no placeholder and no second
  UPDATE.
- **AD-20: Error mapping is centralized in `lib/http/handle.ts`.**
  - Zod failures and `ValidationError` return 400 with `details.fieldErrors`.
  - `NotFoundError` returns 404, and `ConflictError` returns 409.
  - Anything else returns 500 with a generic message; the error is logged on the
    server and never sent to the client.
  - Malformed JSON returns 400.
  The `{ fieldErrors }` shape is designed to drive the inline form errors in
  Phase 9.

## AI Prompts Log

| # | Date | Prompt (summary) | Output review / corrections |
| - | ---- | ---------------- | --------------------------- |
| 1 | 2026-10-26 | "You are a senior full-stack engineer… fill in all six context files (project overview, architecture, code standards, UI context, AI workflow rules, progress tracker) for an ACME salary manager; planning only, no app code; commit `docs: add project context and spec files`." | Reviewed against the brief. The AI raised these issues instead of silently picking an answer: the SQLite/Postgres provider split (Q1), the delete semantics (Q2), the 32-bit Int overflow risk for minor units (AD-1), and the absence of `percentile_cont` on SQLite, which led to a portable window-function median (AD-4). |
| 2 | 2026-10-26 | "go ahead as suggest" (approve all recommendations, start work) | The AI adopted Postgres everywhere (AD-12) and simplified the median (AD-4 → `percentile_cont`) and search (AD-6 → `ILIKE`, dropping the `searchText` column), because the portability constraints no longer applied. Docker was not installed, so it used the running Homebrew Postgres 15 for dev and test. The docs were committed separately before Phase 1. |
| 3 | 2026-10-26 | "start where you left off" (resume Phase 1) | Reviewed the generated scaffold rather than accepting it as-is:<br>• Prisma's `prisma7.config.ts` was renamed to `prisma.config.ts`, and the client output was moved out of `app/`.<br>• The unexpected `cn` dependency was verified as official before it was kept.<br>• A broken font variable (`--font-sans` referencing itself) was fixed.<br>• Token names that clashed with shadcn's `--accent-foreground` and `--ring` were renamed.<br>• The deprecated `vite-tsconfig-paths` plugin was removed.<br>• The user rejected AI co-author trailers on commits, so commits carry no AI attribution. |
| 4 | 2026-10-26 | "yes" (start Phase 2), then "go ahead; start with something else, test it again after some time if it is blocking" | Every result was checked by running it, not by reading the code:<br>• Determinism was proven with an md5 of every row across two seed runs.<br>• Plausibility was checked with USD medians per country computed in SQL.<br>• The seed was timed at 4.4 s against its 10 s target.<br>• Bugs caught: a stale Prisma client after `migrate dev`, and a 30 s `npx` overhead in test setup.<br>• Long builds now run in the background while the docs are updated. |
| 5 | 2026-10-26 | "continue" (Phase 3) | The AI checked the Next 16 route handler docs (`RouteContext`, async `params`) before writing handlers. During design it found an audit gap (country moves change currency) and a concurrency race on "old salary", and fixed both (AD-17, AD-18). It moved the transactional history write from Phase 6 into Phase 3, to avoid shipping a known invariant violation. A mutation test confirmed the history tests fail when the write is removed. Product rules it had to assume are listed as Open Questions 9–12 instead of being decided silently. |

## Session Notes

- 2026-10-26: The repo started empty, apart from the context templates provided in
  chat, so they were created under `context/`. No app code exists yet. Next session:
  read all six files, apply the answers to the Open Questions, then start Phase 1.
- 2026-10-26: The open questions are resolved. Local dev uses Homebrew Postgres 15 on
  `localhost:5432` (Docker is not installed on this machine). The databases are
  `acme_salary` (dev) and `acme_salary_test` (tests).
- 2026-10-26: Phase 2 is done. Gotchas:
  - Prisma 7's `migrate dev` no longer regenerates the client, so run
    `npm run db:generate` after a schema change.
  - `npx prisma` adds about 30 s on this machine (a registry lookup), so scripts call
    `node_modules/.bin/prisma` or go through npm scripts.
  - Run long commands (build, install) in the background so they don't block other
    work.
