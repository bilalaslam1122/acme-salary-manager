# Code Standards

## General

- Keep modules small and single-purpose. A file should do one thing, and a service
  module should own one resource.
- Fix root causes. Do not add workarounds, suppressions (`@ts-ignore`,
  `eslint-disable`) or retries to hide a bug.
- Do not mix concerns. UI does not touch Prisma, route handlers do not contain
  business rules, and services do not know about HTTP.
- Name things after the domain (`salaryMinor`, `fxVersion`, `terminateEmployee`), not
  after the implementation.
- Add no dependency without a reason, and record the reason in `progress-tracker.md`
  under Architecture Decisions.

## TypeScript

- `strict: true` and `noUncheckedIndexedAccess: true` are required. The build must
  have zero type errors.
- Do not use `any`. Use `unknown` and narrow it with Zod or type guards.
- Derive types from their source. Use `z.infer<typeof schema>` for inputs and the
  Prisma-generated types for DB rows. Do not hand-write duplicate interfaces.
- Services throw typed domain errors (`NotFoundError`, `ConflictError`,
  `ValidationError`) from `lib/errors.ts`. Never throw strings.
- Read environment variables only through `env()` from the Zod-validated
  `lib/env.ts`, never from `process.env` directly. The one exception is
  `prisma.config.ts`, which runs in the Prisma CLI.
- Import server-only modules (`lib/db`, `lib/services`) with `import "server-only"`
  at the top, so they can never end up in a client bundle.

## Next.js

- Default to server components. Add `"use client"` only for interactivity: forms,
  table controls, charts, or sheets.
- Server components load data by calling `lib/services/*` directly. Client components
  mutate through `app/api/*` with `fetch`.
- Keep directory state (page, search, filters, sort) in URL search params, so views
  can be linked and the back button works.
- Use `loading.tsx` and `error.tsx` for each route segment, and `not-found.tsx` for
  missing employees.
- After a mutation, refresh data with `router.refresh()`. Do not keep a parallel
  client cache.

## Styling

- Use only the CSS custom-property tokens defined in `ui-context.md`. Do not hardcode
  hex values or Tailwind palette colours such as `bg-blue-500`.
- Follow the radius scale and spacing patterns in `ui-context.md`.
- Right-align numbers in tables and use `tabular-nums`. Format currency with
  `Intl.NumberFormat` through `lib/money`.

## API Routes

- Parse the input first. Run `schema.safeParse()` on the body and query, and return
  `400` on failure before any other logic runs.
- Enforce auth before any read or mutation. `proxy.ts` is the first line of defence,
  and handlers also call `requireSession()`.
- Use a consistent response shape:
  - Success is `{ "data": T }`. Paginated success is
    `{ "data": T[], "meta": { "page", "pageSize", "total", "totalPages" } }`.
  - Error is `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
- Status codes are: `200` read/update, `201` create, `204` delete or terminate, `400`
  validation, `401` no session, `404` not found, `409` conflict (duplicate email or
  code), `500` unexpected. A 500 response never leaks a stack trace or SQL.
- Map domain errors to HTTP in one shared helper, `lib/http/handle.ts`.
- REST resources are `/api/employees`, `/api/employees/[id]`,
  `/api/employees/[id]/history`, `/api/insights/*`, `/api/reference` (countries,
  departments, titles) and `/api/auth/*`.

## Data and Storage

- Store money as integer minor units plus a currency code. Convert to and from major
  units only in `lib/money` and at the UI edge.
- Do USD conversion in SQL by joining the active `ExchangeRate` version. Cast to
  `BIGINT` before multiplying, to avoid int4 overflow on Postgres.
- Every salary write goes through `lib/services/employees`, inside
  `prisma.$transaction`, together with its SalaryHistory row.
- Raw SQL must be parameterised (Prisma tagged template or `Prisma.sql`). Never
  interpolate strings into SQL.
- Never add or remove indexes casually. Every index has a query that needs it, noted
  in the migration's commit message.
- Schema changes are made only through `prisma migrate`. Never edit an applied
  migration.

## Testing

- Every unit ships with its tests in the same commit. Never commit a failing or
  skipped test.
- Tests are fast and deterministic. They make no network calls, do not depend on wall
  clock time (inject or freeze time), and do not depend on run order.
- Integration tests run against an isolated Postgres test database
  (`TEST_DATABASE_URL`, for example `acme_salary_test`). It is migrated with
  `prisma migrate deploy` in global setup and truncated between tests. Integration test
  files run sequentially (no file parallelism) so they never interfere. Tests never
  touch the dev database: global setup refuses any database whose name does not end
  in `_test`. Vitest projects are `unit` (node, `*.test.ts` under lib, prisma and
  app), `component` (jsdom, `*.test.tsx`) and `integration` (node,
  `tests/integration/**`).
- Test one behaviour per test, with a readable name such as
  `it("writes a SalaryHistory row when salary changes")`.
- Build test data with small factories in `tests/factories.ts`. Do not reuse the
  10,000-row seed in unit or integration tests, except for a single dedicated
  performance smoke test.
- What gets tested in each layer:
  - Pure functions (`lib/money`, seed generators) get unit tests.
  - Services get integration tests against the test DB.
  - Route handlers get tests for the status code and response shape on success,
    validation failure, 401 and 404.
  - Components get React Testing Library tests for user-visible behaviour, queried by
    role or label.

## File Organization

- `app/(auth)/login/` holds the login page.
- `app/(app)/employees/`, `app/(app)/employees/[id]/` and `app/(app)/insights/` hold
  the authenticated pages, which share the app shell layout.
- `app/api/` holds route handlers, mirroring the REST resources.
- `components/ui/` holds the shadcn primitives (protected). `components/<feature>/`
  holds feature components.
- `lib/services/`, `lib/db/`, `lib/validation/` and `lib/money/` are described in
  `architecture.md`. Shared helpers are `lib/errors.ts`, `lib/env.ts` and
  `lib/http/`.
- `prisma/` holds the schema, migrations, `seed.ts`, and `seed/` generators.
- `tests/` holds setup, DB helpers, factories and `integration/`. Unit tests are
  co-located as `*.test.ts(x)`.
- `context/` holds the spec files. Update them in the same commit as the code they
  describe.
