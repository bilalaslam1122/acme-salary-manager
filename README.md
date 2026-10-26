# ACME Salary Manager

Salary management and pay insights for ACME's HR Manager. The specs live in
[`context/`](context/). Start with [`project-overview.md`](context/project-overview.md).

## Requirements

- Node.js 20.19+
- PostgreSQL 15+, running locally (Homebrew or Docker)

## Setup

```bash
cp .env.example .env          # set DATABASE_URL and TEST_DATABASE_URL
createdb acme_salary
createdb acme_salary_test
npm install                   # also generates the Prisma client
npm run dev
```

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
