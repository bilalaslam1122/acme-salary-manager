# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 12, deployment: live at https://acme-salary-manager-jade.vercel.app
  (Vercel + Neon). The demo video is the last open item.

## Current Goal

- Phase 12: deploy to Vercel + Neon, seed production, and write the demo script for
  the video.

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
      - Filters cover country, department, job title and employment status (active, terminated or all).
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
- [x] Phase 8:
      - `/login`: the card form is in the static HTML, and `?next=` is checked by
        `safeNextPath` to prevent open redirects.
      - `/` redirects to `/employees`.
      - App shell: a fixed sidebar at 1024px and wider, and a sheet below that, with
        the active nav state, the user's name and email, and sign out.
      - `/employees` is a partial prerender. The static shell is followed by a
        Suspense-streamed directory:
        - a debounced (300 ms) search, filter selects for country, department and
          title, and a "show terminated" switch;
        - sortable column links with `aria-sort`;
        - local and USD salary columns;
        - pagination with "Showing x–y of n";
        - an empty state with "Clear filters", plus `loading.tsx` and `error.tsx`.
      - Pure helpers, each unit-tested: `formatMoney` and `formatUsdCents`,
        `safeNextPath`, and `parseDirectoryQuery`, `directoryHref` and `sortHref`.
      - 34 new tests (unit and React Testing Library).
      - Smoke-tested on `next start`: 42 ms render with the USD sort, and a clean
        server log.
      - Known gap: the Insights nav link returns 404 until Phase 10.
- [x] Phase 9:
      - Create/edit form in a 480 px Sheet.
        - It validates with the API's own Zod schemas, then shows server field
          errors (including the 409 duplicate email) inline on the same fields.
        - Salary is entered in major units. `parseMajorToMinor` converts it without
          floating-point maths and rejects decimals for JPY.
        - The currency suffix follows the selected country.
        - Edits send only the changed fields. A country change always includes the
          salary, and the "Reason for change" field appears only when the salary
          changes.
      - The terminate button sits behind an AlertDialog. Terminated employees are
        read-only: no Edit or Terminate (Q10).
      - `/employees/[id]` (partial prerender) shows a header with local salary and
        USD at the active FX version, plus a paginated salary history table (date,
        previous, new, change %, a GBP → JPY marker for currency moves, reason, and
        changed by, where null shows as "System"). It also has not-found and error
        states.
      - The directory gets an "Add employee" button and name links to the detail
        page. Toasts use `<Toaster theme="light">`.
      - `zodFieldErrors` is shared by `handle.ts` and the form.
      - `getEmployeeDetail` takes its USD figure from the same SQL fragment as the
        directory.
      - 31 new tests (unit, component and integration).
      - Smoke-tested on `next start`: a full create → raise → terminate cycle
        through the API, checking the detail HTML after each step, with zero log
        errors.
- [x] Phase 10:
      - `/insights` (partial prerender) has:
        - a URL-driven filter row that scopes everything;
        - a KPI row (headcount, median, average, range);
        - "Median salary by" country, department or title (link tabs), with a
          horizontal bar chart and a full stats table;
        - headcount by country;
        - the salary histogram;
        - a "View as table" twin for each chart, an empty state, and loading and
          error states;
        - the FX version in the footer.
      - The Recharts components are thin, and all shaping logic is in pure
        `lib/insights/chart-data.ts`.
      - `FilterSelect` is shared with the directory.
      - 27 new tests: unit tests for the URL, chart data and compact USD, and
        component tests that render the real Recharts charts at a fixed size.
      - Live check: the dashboard's stat tiles match the API's `/summary` JSON
        exactly for 3 filter sets (12 of 12 values), it renders in 46 ms, and the
        server log has no errors. The Insights nav link now works.
- [x] Pagination UX, requested by the user on 2026-10-27:
      - A shared `Pagination` component with numbered pages and ellipses, at a
        constant 7-slot width.
      - First, previous, next and last controls, a "Showing x–y of n" summary, and
        rows per page (25, 50, 100).
      - "Go to page" (clamped), a compact mobile mode, and recovery from a page
        past the end.
      - Replaces both the directory and the salary history pagers.
      - The pure `pageItems` and `pageRange` functions in `lib/pagination.ts` have
        12 unit tests, including the constant-width property over 200 pages, and
        the component has 13 tests.
      - Live check on `next start`: page numbers, the selected page size, and
        filter-preserving canonical hrefs.
      - Tidy-up: the deprecated React `FormEvent` type was replaced with
        `SubmitEvent` in all 3 forms.
- [x] Phase 11:
      - States audit and fixes:
        - A branded root `not-found.tsx` (unknown URLs now return a real 404).
        - A `global-error.tsx` for root-layout failures.
        - Route error cards show Next's error `digest` as a reference ID.
        - A "Skip to content" link, with `main` focusable.
      - The empty states now tell three situations apart: a page past the end
        ("Go to the first page"), filters that match nothing ("Clear filters"),
        and no employees yet (points to "Add employee"). Insights does the same.
      - Performance, measured as real HTTP requests to `next start` at 10k+
        employees (20 warm requests each):
        - directory API: 12–31 ms median (worst 33 ms; goal under 300 ms);
        - insights API: 20–30 ms median (worst 31 ms; goal under 500 ms);
        - full pages: 20–40 ms.
        - The service-level performance tests agree: 4–44 ms.
      - README rewritten for reviewers: features, quick start, architecture, key
        decisions linked to ADs, testing (310 tests), performance table, the
        spec-driven workflow with the AI prompts log, and known limitations.

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
- [x] **Phase 8:** `feat:` UI: the app shell, login page, and employee directory table
      with URL-driven filters.
- [x] **Phase 9:** `feat:` UI: the create/edit employee sheet, terminate confirmation,
      and employee detail with history.
- [x] **Phase 10:** `feat:` UI: the insights dashboard with stat cards and charts.
- [x] **Phase 11:** `chore:` Polish the empty, error and loading states, verify the
      performance goals at 10k, and write the README.
- [x] **Phase 11b:** Hardening after reviewing the build against the brief, one
      commit each:
      - `fix(directory):` an Active / Terminated / All status filter replaces the
        "show terminated" switch, and the seed adds 400 former employees (AD-36).
      - `feat(employees):` an audit trail for non-salary changes, terminations and
        reinstatements, plus reinstate (AD-37, AD-38).
      - `feat(export):` CSV export of the directory and the insights table (AD-39).
      - `test:` latency budgets moved out of `npm test` (AD-40).
      - `fix(seed):` the seed refuses to wipe real HR changes (AD-41).
      - `fix(insights):` employees without an FX rate are counted, not silently
        dropped (AD-42).
- [x] **Phase 12:** `chore:` Deployed to Vercel (`iad1`) with Neon Postgres
      (us-east-1). Migrated and seeded through the direct URL; the app uses the
      pooled URL. A live smoke test covered the auth redirects and 401s, login, the
      directory, status filter, insights, CSV export, and a terminate/reinstate
      write through the pooler (its test events were removed afterwards).
- [ ] Record the demo video.

## Open Questions

- None open.

Resolved:

- Phase 3 assumptions 9–12 were confirmed by the user on 2026-10-26 ("sure"):

9. **Employee code:** server-generated as `ACME-{id:05}`. HR cannot enter their
   existing codes from Excel. Changing this would be a small, additive change if
   needed.
10. **Terminated employees are read-only.** Editing or re-terminating one returns 409.
    *Revised in Phase 11b:* a terminated employee can now be reinstated (with a
    reason), because a mistaken termination with no undo is a real HR risk (AD-37).
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
- **AD-29: The directory UI is server-rendered from the URL.**
  - The page parses `searchParams` with the API schema and calls `listEmployees`
    directly (AD-10).
  - Sorting and pagination are plain `<Link>`s, which work without JS and support
    prefetch and Back.
  - Only the toolbar is a client component. It pushes new URLs inside
    `startTransition`, so the old table stays visible with a spinner instead of
    flashing a skeleton.
  - URLs are canonical (fixed key order, defaults omitted). A test caught two
    different URLs for the same view.
  *Alternative:* client-side fetching of `/api/employees` with local state. That
  means more JS, no SSR, and duplicated loading logic.
- **AD-30: Lessons from Cache Components and Partial Prefetching (Next 16).**
  - The build succeeded, but `next start` logged "unstable value `new Date()` while
    prerendering `/employees`". The cause: `verifySessionToken` reads the clock
    after `cookies()`, and with Partial Prefetching, cookies resolve during a
    runtime prerender. The fix is `await connection()` in `getCurrentSession()`.
  - `useSearchParams` in the login form made the form client-only, so the HTML had
    no form. The fix reads `window.location` at submit time.
  - Both were found only by inspecting the live server's HTML and logs. That check
    is now a standing rule in code-standards.md.
  - Phase 9 addition: `usePathname()` is URL data, so on a dynamic route
    (`/employees/[id]`) any client component that reads it must sit under
    `<Suspense>`, or the build fails. The nav now has a static `NavLinksView`
    fallback, and the mobile sheet closes on link clicks by event delegation,
    without `usePathname`.
- **AD-31: The form validates with the API's Zod schemas, and the server stays
  authoritative.** The client parse gives instant inline errors with no extra
  request. Server-only rules (unknown department, duplicate email) come back as
  `fieldErrors` and land on the same fields. The PATCH diff sends only changed
  fields, so the history records exactly what the user changed.
  *Alternative:* react-hook-form plus a resolver, a dependency this single form
  doesn't need.
- **AD-32: A missing employee returns HTTP 200 with the not-found UI and a
  `noindex` meta tag.** Under Cache Components, the detail page streams inside
  Suspense, so `notFound()` runs after the 200 headers are sent. Next then renders
  `not-found.tsx` and adds `noindex`. For an internal, authenticated tool, the
  correct UI plus noindex is acceptable. The API still returns a true 404.
  *Alternative:* resolving the employee outside Suspense blocks the whole shell on
  a DB read on every request.
- **AD-33: The job title input is an `<input>` with a `<datalist>` of titles in
  use.** It is not the command+popover combobox from ui-context.md. It is native,
  accessible, works with keyboard and mobile, needs no new dependency, and still
  allows a new title (Q5: free text).
- **AD-34: The chart method follows the dataviz guidance.**
  - **Form first:** every chart is a single series of magnitude over nominal
    categories, so each uses one color for every bar. A darker-is-bigger ramp would
    double-encode bar length, and a categorical palette would invent identities that
    don't exist.
  - The headline numbers are stat tiles, not charts.
  - The "Salary by" view plots only the median (one honest measure) and moves
    min, avg and max into an always-visible table, instead of a crowded range-bar
    chart.
  - The color was validated with the dataviz `validate_palette.js` rather than
    eyeballed.
  *Alternative:* a min–max range bar with a median marker. It is richer, but harder
  to read at 15 job titles, and Recharts range bars in the vertical layout add
  complexity.
- **AD-35: Charts are thin client components fed by pure data shaping.** jsdom has
  no layout, so `ResponsiveContainer` draws nothing in tests. The shaping logic
  (cents to dollars, ordering, bucket labels, container height including the axis
  band) is unit-tested, and the chart components are rendered with a fixed-size
  container stand-in to check their real configuration. One vacuous test (it
  claimed to check bar order but asserted nothing) was deleted rather than kept.
- **AD-36: The directory filters by employment status instead of toggling
  "include terminated".** The switch mixed leavers into the active list sorted by
  name, so with one leaver among 10,000 rows it looked broken. Real HR questions
  are "who is here now", "who left recently" and occasionally "everyone", so the
  filter is Active / Terminated / All, and the Terminated view sorts by the new
  "Left on" column, newest first. The seed adds 400 former employees (4%
  attrition) after the 10,000 active ones, so the active dataset and its ids are
  unchanged and the view has realistic data.
  *Alternative:* keep the switch and pin terminated rows to the top. That is
  still a mixed list, and it breaks every sort.
- **AD-37: Non-salary changes get their own audit table, `employee_events`.**
  SalaryHistory stays as it is, since its shape (old and new amount, currencies,
  % change) is specific to money. EmployeeEvent records UPDATED (a JSON map of
  field to from/to), TERMINATED and REINSTATED, with the actor, a timestamp and,
  for terminate/reinstate, a required reason. Field changes store display values
  (department and country names), so the trail still reads correctly after a
  rename. A salary edit writes only SalaryHistory, so nothing is recorded twice.
  *Alternative:* one generic audit table for everything, including salary. It is
  uniform, but loses typed columns for the money queries and means migrating
  working, tested code for no user-visible gain.
- **AD-38: Terminate and reinstate are explicit `POST` actions, not `DELETE`.**
  Both need a body (the reason) and neither deletes anything, so `DELETE` was
  misleading and can't portably carry a body.
- **AD-39: CSV export, not Excel import, closes the spreadsheet gap first.** HR
  needs numbers back in Excel every week; an import is a one-off migration that
  needs a validation and dry-run report to be safe, so it stays out of scope.
  Exports are exactly the on-screen view (all pages), amounts are exact decimals
  built from minor units (no floats), the file has a UTF-8 BOM so Excel shows ¥, €
  and accented names, responses are `no-store`, text cells starting with
  `= + - @` are neutralised (CSV injection), and exports over 50,000 rows fail
  loudly instead of truncating.
- **AD-40: Latency budgets are a separate, on-demand test project.** Asserting
  wall-clock time inside `npm test` made the suite's result depend on the machine.
  `npm run test:perf` still checks Goals 1 and 2 against the full seed.
- **AD-41: The seed's safety check looks at the data, not the environment.** It
  refuses to run when salary changes or events were made by a signed-in user,
  since that is exactly the work a reset destroys; `SEED_FORCE=true` overrides.
  *Alternative:* block on `NODE_ENV=production`. That misses the common mistake,
  which is running the seed locally with a production `DATABASE_URL`.
- **AD-42: Employees whose currency has no FX rate are reported, not dropped
  silently.** The USD aggregates must exclude them, but the summary returns
  `excludedWithoutFx` and the Insights page shows a warning, so headcount never
  disagrees with the directory without explanation.
- **AD-43: The public demo signs in with one click, as a separate demo account.**
  Reviewers should not need credentials passed around, and the real HR Manager
  password should not be published. The seed creates `demo@acme.example` with a
  random password that is hashed and discarded, so the normal login form can never
  open it. `POST /api/auth/demo` issues a session for it, and only exists when
  `DEMO_LOGIN=true` (404 otherwise; off by default). The data is shared, so the
  page says so, and the seed's guard ignores demo-account changes so the demo can
  always be reset.
  *Alternative:* print demo credentials on the login page. It is the same access
  with more friction, and anyone could change the password-bearing account.

## AI Prompts Log

I built this with an AI coding assistant (Claude Code). The context files were the
contract: I wrote the brief into them first, then had the assistant implement one
phase at a time against them. I reviewed every phase by running it (tests, the
production build, and live `curl` and browser checks against `next start`), not by
reading the diff alone. The table records what I asked for, what I checked, and
what I changed or rejected.

| # | Date | What I asked for | What I checked, changed or rejected |
| - | ---- | ---------------- | ----------------------------------- |
| 1 | 2026-10-26 | Act as a senior full-stack engineer and fill in all six context files (overview, architecture, code standards, UI, workflow rules, progress tracker) for the ACME salary manager. Planning only, no code. | I asked for open questions to be listed, not silently decided. That surfaced the SQLite vs Postgres split (Q1), delete semantics (Q2), the 32-bit overflow risk for minor units (AD-1), and the lack of `percentile_cont` on SQLite (AD-4). |
| 2 | 2026-10-26 | Approve the recommendations and start. | I chose Postgres everywhere (AD-12), which let the median use `percentile_cont` and search use plain `ILIKE`, and dropped the denormalised `searchText` column that only existed for SQLite. |
| 3 | 2026-10-26 | Phase 1: scaffold Next.js, Prisma, Vitest and tooling. | I did not accept the scaffold as generated: I moved the Prisma client out of `app/`, renamed `prisma7.config.ts`, fixed a self-referencing font variable, renamed tokens that clashed with shadcn's, removed the deprecated `vite-tsconfig-paths`, and checked the unfamiliar `cn` dependency before keeping it. Commits carry no AI attribution. |
| 4 | 2026-10-26 | Phase 2: schema, migration and a deterministic 10,000-employee seed. | I proved determinism with an md5 of every row across two runs, sanity-checked USD medians per country in SQL, and timed the seed (4.4 s against a 10 s target). |
| 5 | 2026-10-26 | Phase 3: employee service, CRUD API and validation. | Design review found two gaps I made the assistant fix before moving on: a country move changes currency, so history must record both (AD-17), and concurrent edits could record the wrong "old" salary, so the row is locked (AD-18). I pulled the transactional history write forward from Phase 6 so no commit ever violated Invariant 5, and confirmed by mutation that the tests fail when the write is removed. |
| 6 | 2026-10-26 | Phase 4: paginated directory with search, filters and sort. | Before accepting the queries I ran EXPLAIN ANALYZE on the 10k dataset. USD conversion is checked against hand-computed values across GBP, USD, JPY (no minor unit) and INR, and an injection-style `sort` value has a test. |
| 7 | 2026-10-26 | Phase 5: insights service and API. | The SQL is verified two independent ways: hand-computed fixtures (including an even-count median) and a JavaScript calculation over generated data. I replaced one test that never exercised the bucket clamp it claimed to cover. The build log exposed a Phase 3 bug (`handle()` swallowed Next's prerender signal as a 500), fixed with `unstable_rethrow` and a test. |
| 8 | 2026-10-27 | Phase 6: salary history API with rollback and concurrency tests. | Rollback is tested with a real FK failure, not a mock. Without `FOR UPDATE` the concurrency test fails 3 times in 5; with it, 5 in 5 pass. |
| 9 | 2026-10-27 | Phase 7: HR Manager auth. | I asked for the Next 16 proxy docs to be read first; their advice not to rely on the proxy alone led to two auth layers (AD-26), and a mutation check confirmed the 401 sweep catches a missing session check. A new env test exposed a Zod 4 bug (`z.email().trim()` validates before trimming), fixed in all three schemas. I smoke-tested login, logout, redirects and cookie flags with `curl`. |
| 10 | 2026-10-27 | Phase 8: app shell, login and directory UI. | Logic went into pure, tested helpers because async server components can't run in Vitest. A component test caught non-canonical URLs (parameter order depended on click order). Inspecting the live HTML found two issues the tests and build missed: a prerender clock error and a login form missing from the HTML (AD-30). |
| 11 | 2026-10-27 | Phase 9: employee form, detail page and salary history UI. | The build failed (`usePathname` outside Suspense) but a shell pipeline had hidden the exit code; I switched to checking the real exit status and re-verified earlier phases. I checked a full create, raise and terminate cycle against the live server. The not-found HTTP 200 was investigated and recorded as a known limitation (AD-32). |
| 12 | 2026-10-27 | Phase 10: insights dashboard. | I had the dataviz guidance applied before any chart code: one honest measure per chart, colours validated with a script. I deleted one vacuous test. An unexpected count of 10,001 was traced in SQL to an employee I had added through the UI, rather than "fixed". The dashboard tiles match the API exactly. |
| 13 | 2026-10-27 | Make pagination clearer: numbered pages, rows per page and "go to page". | Scoped as its own commit. The page-number algorithm is a pure, property-tested function. A component test caught native `min`/`max` validation blocking the friendlier clamp; fixed with `noValidate`. |
| 14 | 2026-10-27 | Phase 11: empty, error and loading states, performance, README. | I audited the routes for missing states and found six gaps (no root not-found page, no global error page, no skip link, dropped error digests, empty states that blamed filters that weren't applied, and a past-the-end page shown as "no matches"). Performance was measured over real HTTP, not only at the service level. |
| 15 | 2026-10-27 | Review the whole submission strictly against the brief, then fix what it finds. | I used it as a second reviewer and kept what held up. The "show terminated" switch was effectively broken (no leavers in the seed, one leaver buried in 10,000 rows), so I replaced it with a status filter (AD-36). The audit trail only covered salary, so I added `employee_events` and reinstate (AD-37, AD-38). With no way back to Excel, I added CSV export (AD-39). Timing assertions in `npm test` were not deterministic (AD-40). The seed could wipe real data (AD-41), and insights dropped employees without an FX rate silently (AD-42). I rejected two findings after checking the code: the toast theme was already pinned to light, and `shadcn` is a real build input via `globals.css`. |

## Session Notes

- Local dev uses Postgres 15 on `localhost:5432`, with the databases `acme_salary`
  (dev) and `acme_salary_test` (tests).
- Prisma 7's `migrate dev` no longer regenerates the client, so run
  `npm run db:generate` after a schema change.
- Scripts call `node_modules/.bin/prisma` (or npm scripts) rather than `npx prisma`,
  which adds a slow registry lookup.
- Check the build's real exit status; a pipeline like `npm run build | tail` hides a
  failure.
