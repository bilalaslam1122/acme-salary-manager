# ACME Salary Manager

## Overview

ACME employs 10,000 people across 8 countries. The HR Manager keeps salary data in
Excel. That makes edits risky, leaves no record of who changed a salary or when, and
turns questions like "what is the median salary for engineers in India?" or "how does
a Senior Engineer's pay compare across countries in USD?" into slow, manual pivot-table
work. ACME Salary Manager is an internal web app for that one HR Manager. It holds
employee and salary records, records every salary change, and answers pay questions
across country, department and job title from a single dashboard.

## Goals

1. The employee directory returns any page (50 rows, any search, filter or sort
   combination) in **< 300 ms server time** with 10,000 employees seeded.
2. The insights endpoints return in **< 500 ms server time** at 10,000 employees.
3. Any question in the Success Criteria can be answered in **≤ 2 clicks** from the
   insights page.
4. **100% of salary changes** have a matching SalaryHistory row (enforced by a
   transaction and covered by tests).
5. Search, sort and filter work on the server. The browser never loads more than one
   page of employees.

## Core User Flow

1. The HR Manager signs in with the seeded credentials.
2. They browse the employee directory: search by name, email or code, filter by
   country, department or job title, sort by column, and page through results.
3. They add a new employee, or open one and edit their details or salary.
4. They view that employee's salary change history.
5. They open Insights and see headcount and salary statistics (min, max, avg, median)
   grouped by country, department or job title, in USD.
6. They filter Insights by country, department or job title to narrow the question.

## Features

### Employee management

- Create, view, edit and terminate employees. Termination is a soft delete; see the
  open questions.
- Each employee has a name, email, employee code, job title, department, country,
  hire date, and an annual base salary in the country's currency.
- Every salary change, including the initial salary, writes an audit row: old value,
  new value, currency, who made the change, when, and an optional reason.

### Employee directory

- Server-side pagination: 50 rows per page by default, 100 at most.
- Search is case-insensitive and matches name, email or employee code.
- Filters for country, department and job title, which can be combined.
- Sort by name, job title, hire date, or salary normalized to USD.

### Salary insights

- Min, max, average and median salary, grouped by country, department or job title.
- Headcount by country.
- A histogram of the salary distribution, in USD.
- Cross-country comparison in USD. Rates come from a static, versioned FX table, and
  each result shows the rate version and date it used.

## Scope

### In Scope

- A single HR Manager login, employee CRUD, the directory, insights, salary history,
  a deterministic 10,000-employee seed, and deployment.

### Out of Scope

- **Payroll, tax and payslips.** These are regulated, country-specific domains. This
  app manages pay data and does not pay anyone.
- **Live FX rates.** A third-party dependency would make results non-reproducible and
  tests non-deterministic. A versioned static table is auditable.
- **RBAC and SSO.** There is one user persona. Adding roles would be speculative
  complexity.
- **Multi-tenancy.** The app serves one organization (ACME).
- **Excel import.** This is a stretch goal, not required by the core flow. It is
  revisited after Phase 12.
- **Bonuses, equity and benefits.** The questions asked are about base salary. Other
  compensation types would multiply the data model.
- **Dark mode.** It does not help answer the HR Manager's questions. The design tokens
  are structured so it could be added later.

## Success Criteria

1. The signed-in HR Manager can create, edit and terminate an employee. Each change
   appears in the directory immediately.
2. Changing a salary adds exactly one SalaryHistory row with the old and new values.
3. Directory search, filters and sort all run on the server and meet Goal 1 at 10,000
   rows.
4. Insights answer, in ≤ 2 clicks: min, max, avg and median salary by country,
   department and job title; headcount by country; the salary distribution; and a job
   title's pay across countries in USD.
5. Unauthenticated requests to any page or API other than login are rejected or
   redirected.
6. `npm run test`, `npm run lint` and `npm run build` all pass. The seed produces
   identical data on every run.
