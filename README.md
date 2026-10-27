# ACME Salary Manager

Salary management and pay insights for ACME's HR Manager. The specs live in
[`context/`](context/). Start with [`project-overview.md`](context/project-overview.md).

## Requirements

- Node.js 20.19+
- PostgreSQL 15+, running locally (Homebrew or Docker)

## Setup

```bash
cp .env.example .env          # set the database URLs, SESSION_SECRET and SEED_ADMIN_*
createdb acme_salary
createdb acme_salary_test
npm install                   # also generates the Prisma client
npm run db:migrate            # apply migrations to the dev database
npm run db:seed               # 10,000 employees + the HR Manager login (~5s, replaces all data)
npm run dev
```

Sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from your `.env`.

## Scripts

| Script               | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the dev server                          |
| `npm run build`      | Generate the Prisma client and build for prod |
| `npm run test`       | Run all tests once                            |
| `npm run lint`       | ESLint with zero warnings allowed             |
| `npm run typecheck`  | Generate route types and run `tsc`            |
| `npm run format`     | Format with Prettier                          |
| `npm run db:migrate` | Create or apply migrations in development     |
| `npm run db:deploy`  | Apply migrations (CI / production)            |
| `npm run db:seed`    | Replace all data with the deterministic seed  |
| `npm run db:reset`   | Drop, re-migrate and re-seed the dev database |

`npm run test` runs the unit, component and integration projects. The integration
tests need `TEST_DATABASE_URL`, and the database name must end in `_test`.
