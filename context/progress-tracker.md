# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 7, HR Manager auth: complete. The backend is complete. Phase 8 (UI) is next.

## Current Goal

- Phase 8: UI: the app shell, the login page, and the employee directory table with
  URL-driven filters.

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
- [x] Phase 4:
      - `GET /api/employees` returns `{ data, meta }` with page, pageSize (max 100),
        total, totalPages and fxVersion.
      - Search uses `ILIKE` over first name, last name, full name, email and code,
        with wildcards escaped.
      - Filters cover country, department, job title and `includeTerminated`.
      - Sort by name, job title, hire date or USD salary, ascending or descending,
        with an id tiebreak.
      - A single raw-SQL path lives in `lib/db/employee-directory.ts`. The shared FX
        SQL is in `lib/db/fx.ts`, ready for Phase 5.
      - The Phase 2 indexes already cover the filters, so no new migration was
        needed.
      - 35 new tests, including a 10k-row performance test (3–32 ms against the
        300 ms budget).
- [x] Phase 5:
      - Insights in USD cents at the active FX version, for active employees only.
        Each response carries `meta.fx` (version and effective date).
      - `GET /api/insights/summary`: headcount, min, max, avg and median.
      - `GET /api/insights/by-group?groupBy=country|department|jobTitle`: the same
        stats per group, highest median first. This also covers headcount by
        country and a title's pay across countries.
      - `GET /api/insights/distribution`: a histogram of 20 or fewer $5k-aligned
        buckets.
      - Shared filters (country, department, job title) are in one SQL and
        validation module, and the directory was refactored onto it.
      - 19 new tests:
        - Hand-computed fixtures across 4 currencies, including an even-count
          median.
        - An independent JS calculation over 300 generated employees.
        - The histogram clamp, empty sets, and the APIs.
        - Performance at 10k: 19–29 ms against the 500 ms budget.
- [x] Phase 6:
      - `GET /api/employees/[id]/history` returns `{ data, meta }`, newest first and
        paginated. Each row has old and new salary, each with its own currency and
        exponent.
      - `changePercent` has one decimal, and is null for the initial salary and for
        currency changes.
      - Each row has the reason, and `changedBy` with id and name (null means
        system).
      - The endpoint returns 404 for an unknown employee and works for terminated
        employees.
      - The pagination params are shared through `lib/validation/pagination.ts`.
      - 11 new tests:
        - Rollback: a forced foreign-key failure on the history insert leaves the
          salary and history unchanged, and creates no employee.
        - Concurrent edits keep the history chain consistent. A mutation check
          showed that removing `FOR UPDATE` fails the test in 3 of 5 runs, and it
          passes 5 of 5 with the lock.
- [x] Phase 7:
      - Login and logout APIs, with a stateless HS256 JWT in the HttpOnly
        `acme_session` cookie (8 h).
      - The seed upserts the HR Manager from `SEED_ADMIN_*`, with a bcrypt cost-12
        hash.
      - `proxy.ts` is the first layer: pages redirect to `/login?next=`, and APIs
        return 401.
      - `requireSession(request)` in every protected handler is the second layer, and
        supplies `actorId`. The Phase 3 `TODO(phase-7)` placeholders were removed.
      - The env is split per consumer (DB, auth, seed admin).
      - Fixed a Phase 3 bug: `z.email().trim()` validated before trimming. There is
        now a shared `emailSchema`.
      - 51 new tests, covering:
        - token round-trip, expiry, tampering and a foreign secret;
        - cookie parsing;
        - proxy redirect and 401 behaviour, and the matcher;
        - login success, identical 401s, logout, and admin upsert;
        - a 401 sweep over all 9 protected handlers (mutation-checked);
        - audit attribution through the API.
      - Smoke-tested 10 checks with `curl` against `next start`.

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
- [x] **Phase 4:** `feat:` The list API with pagination, search, filters and sort,
      plus indexes (+ tests, including a performance smoke test at 10k).
- [x] **Phase 5:** `feat:` The insights service and API: min, max, avg and median by
      group, headcount by country, histogram, and USD normalization (+ tests with
      hand-computed expectations).
- [x] **Phase 6:** `feat:` The salary history read API
      (`GET /api/employees/[id]/history`, newest first, paginated) plus explicit
      rollback tests. The transactional write moved into Phase 3, so Invariant 5
      holds from the first salary write.
- [x] **Phase 7:** `feat:` HR Manager auth: seeded user, login and logout API, session
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

- None open.

Resolved:

- Phase 3 assumptions 9–12 were confirmed by the user on 2026-10-26 ("sure"):

9. **Employee code:** server-generated as `ACME-{id:05}`. HR cannot enter their
   existing codes from Excel. Changing this would be a small, additive change if
   needed.
10. **Terminated employees are read-only.** Editing or re-terminating one returns 409,
    and no reinstate action exists.
11. **Hire date:** any valid calendar date is accepted, including a future date for
    planned hires. No other restriction is defined.
12. **Salary change reason:** optional, and only allowed when the salary actually
    changes (otherwise 400).

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
- **AD-21: The directory query is one parameterized raw-SQL path.** Sorting by USD
  salary needs a join to the active FX version, which Prisma's query builder cannot
  express. Using raw SQL for every sort keeps a single code path.
  - ORDER BY expressions come from a whitelist map keyed by the validated enum, so
    user input never reaches SQL text.
  - Rows, count and FX version run as 3 parallel queries.
  - USD = `ROUND(salary_minor × micros / (10^exp × 10⁴))` in cents, using `numeric`
    to avoid int4 overflow. Results are `NULLS LAST` if a currency lacks a rate.
  - Measured on 10k rows with EXPLAIN ANALYZE:
    - The country filter plus name sort uses `employees_last_name_first_name_idx`
      (about 1 ms).
    - Search plus USD sort is a sequential scan plus top-N sort (about 15 ms).
    - Both are far inside the budget. The `pg_trgm` upgrade path stays deferred.
  *Alternative:* `findMany` for name, title and date sorts plus raw SQL for USD. That
  means two code paths that must apply identical filters, which risks drift.
- **AD-22: Insights are three focused endpoints over one `salaries` CTE.**
  - The CTE holds active employees joined to the active FX rates, with USD cents.
  - `summary`, `by-group` and `distribution` map onto the dashboard's stat cards,
    tabbed chart and histogram. Changing the "Salary by…" tab refetches only
    `by-group`.
  - Grouping columns come from a whitelist map, as AD-21 does for sorting.
  - The rates use an INNER join, so a currency with no active rate is excluded
    rather than mis-converted. All seeded currencies have rates.
  *Alternative:* one `/api/insights` endpoint returning everything, which means more
  over-fetching on every tab change.
- **AD-23: Money is reported in USD cents (integers).** This is the minor-units rule
  applied to the output. AVG and median are rounded to whole cents in SQL. The UI
  formats cents through `lib/money`.
- **AD-24: Histogram layout is a pure function (`lib/services/histogram.ts`).** A
  min/max query feeds it, then a `GROUP BY` bucket query counts the rows. Values
  past the last edge are folded into the last bucket with `LEAST(…, n-1)`, so there
  are never more than 20 buckets. Empty buckets are filled in JS: at most 20 array
  slots, which is not aggregation over rows.
- **AD-25: The history API uses Prisma `findMany` and `count`, not raw SQL.** It needs
  no FX join or aggregation. `changePercent` is computed per row on at most 100 rows
  in the service (a presentation value, not aggregation). It is withheld across
  currencies, because a GBP→JPY "percent" would be meaningless. Order is
  `changedAt DESC, id DESC`, so changes on the same timestamp keep a stable order.
- **AD-26: Two-layer auth, with `requireSession(request)` reading the Cookie header.**
  - `proxy.ts` gives a fast, uniform redirect or 401. The Next.js docs warn that the
    proxy alone is not enough (matcher drift), so every handler verifies again.
  - Reading the header from the `Request`, instead of `cookies()` from
    `next/headers`, keeps handlers testable outside a Next request scope, with no
    mocking.
  - `lib/auth` has no DB access, so the proxy never touches Prisma.
  *Alternative:* a DB session table, rejected for the same reasons as AD-9.
- **AD-27: The env is validated per consumer.** `env()` covers the database,
  `authEnv()` the session secret, and `parseSeedAdminEnv` the seed admin. The proxy
  doesn't need `DATABASE_URL`, and the seed doesn't need `SESSION_SECRET`. Tests use
  a fixed test-only secret from `vitest.config.mts`, not the developer's `.env`.
- **AD-28: The admin user is seeded outside `generateDataset`.** bcrypt salts make
  the hash differ on every run, so the `users` row is the one documented exception to
  the byte-identical seed. `upsertAdminUser` is idempotent and rotates the password
  on re-run.

## AI Prompts Log

| # | Date | Prompt (summary) | Output review / corrections |
| - | ---- | ---------------- | --------------------------- |
| 1 | 2026-10-26 | "You are a senior full-stack engineer… fill in all six context files (project overview, architecture, code standards, UI context, AI workflow rules, progress tracker) for an ACME salary manager; planning only, no app code; commit `docs: add project context and spec files`." | Reviewed against the brief. The AI raised these issues instead of silently picking an answer: the SQLite/Postgres provider split (Q1), the delete semantics (Q2), the 32-bit Int overflow risk for minor units (AD-1), and the absence of `percentile_cont` on SQLite, which led to a portable window-function median (AD-4). |
| 2 | 2026-10-26 | "go ahead as suggest" (approve all recommendations, start work) | The AI adopted Postgres everywhere (AD-12) and simplified the median (AD-4 → `percentile_cont`) and search (AD-6 → `ILIKE`, dropping the `searchText` column), because the portability constraints no longer applied. Docker was not installed, so it used the running Homebrew Postgres 15 for dev and test. The docs were committed separately before Phase 1. |
| 3 | 2026-10-26 | "start where you left off" (resume Phase 1) | Reviewed the generated scaffold rather than accepting it as-is:<br>• Prisma's `prisma7.config.ts` was renamed to `prisma.config.ts`, and the client output was moved out of `app/`.<br>• The unexpected `cn` dependency was verified as official before it was kept.<br>• A broken font variable (`--font-sans` referencing itself) was fixed.<br>• Token names that clashed with shadcn's `--accent-foreground` and `--ring` were renamed.<br>• The deprecated `vite-tsconfig-paths` plugin was removed.<br>• The user rejected AI co-author trailers on commits, so commits carry no AI attribution. |
| 4 | 2026-10-26 | "yes" (start Phase 2), then "go ahead; start with something else, test it again after some time if it is blocking" | Every result was checked by running it, not by reading the code:<br>• Determinism was proven with an md5 of every row across two seed runs.<br>• Plausibility was checked with USD medians per country computed in SQL.<br>• The seed was timed at 4.4 s against its 10 s target.<br>• Bugs caught: a stale Prisma client after `migrate dev`, and a 30 s `npx` overhead in test setup.<br>• Long builds now run in the background while the docs are updated. |
| 5 | 2026-10-26 | "continue" (Phase 3) | The AI checked the Next 16 route handler docs (`RouteContext`, async `params`) before writing handlers. During design it found an audit gap (country moves change currency) and a concurrency race on "old salary", and fixed both (AD-17, AD-18). It moved the transactional history write from Phase 6 into Phase 3, to avoid shipping a known invariant violation. A mutation test confirmed the history tests fail when the write is removed. Product rules it had to assume are listed as Open Questions 9–12 instead of being decided silently. |
| 6 | 2026-10-26 | "sure" (confirm assumptions 9–12, then Phase 4) | Before writing tests, the AI ran EXPLAIN ANALYZE against the 10k dev data to confirm index use and timings. It used hand-computed USD expectations (for example £50,000 × 1.27 = $63,500) to verify the conversion across GBP, USD, JPY (exponent 0) and INR. The performance test was run verbose to record the real timings, not just a pass. An SQL-injection-style `sort` value is covered by a test. |
| 7 | 2026-10-26 | "continue" (Phase 5) | The insights SQL was verified two independent ways: hand-computed fixtures across GBP, USD, JPY and INR (including an even-count median), and a JS calculation over 300 generated employees compared against the SQL output. Self-review caught one weak test: the "≤ 20 buckets" case never triggered the clamp. It was replaced with an input that produces 21 buckets without the clamp. The build log exposed a bug from Phase 3: `handle()` caught Next's prerender bail-out error and logged it as a 500. It was fixed with `unstable_rethrow`, verified by a test using `notFound()`, and mutation-checked. The Phase 4 commit had also been made while an overlapping build was failing; from now on, the build must be clean before every commit. The shared filter SQL was extracted, and the existing directory tests were the safety net for that refactor. |
| 8 | 2026-10-27 | "start where you left off" (new session, Phase 6) | The AI reread the context files and the git state first. Rollback was tested with a realistic failure (a broken `changed_by_id` FK) rather than a mock. The concurrency test was proven meaningful by mutation: without `FOR UPDATE` it fails in 3 of 5 runs, and with the lock it passes 5 of 5. The build is confirmed clean before committing. |
| 9 | 2026-10-27 | "continue" (Phase 7, auth) | The AI read the Next 16 `proxy.md` first (Node runtime, matcher syntax, and the docs' advice not to rely on the proxy alone), which led to the two-layer design (AD-26). A new env test exposed a real Phase 3 bug: Zod 4's `z.email().trim()` validates before trimming. It was fixed in all 3 schemas, with a regression test. A mutation check (removing `requireSession` from one route) confirmed the 401 sweep catches it. Beyond the unit tests, it ran a 10-step `curl` smoke test against `next start`: redirects, 401s, cookie flags, login, logout and static assets. The generated dev password went only into the gitignored `.env` and was never printed. |

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
