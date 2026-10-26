import "server-only";
import type {
  EmployeeListQuery,
  EmployeeSortField,
} from "@/lib/validation/employee-list";
import { prisma } from "./client";
import { employeeFilterConditions, whereSql } from "./employee-filters";
import { activeFxVersionCte, queryActiveFx, salaryUsdCentsSql } from "./fx";
import { Prisma } from "./generated/prisma/client";
import { escapeLike } from "./sql";

export interface DirectoryRow {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department_id: number;
  department_name: string;
  country_code: string;
  country_name: string;
  salary_minor: number;
  salary_currency: string;
  currency_exponent: number;
  salary_usd_cents: bigint | null;
  hire_date: Date;
  terminated_at: Date | null;
}

export interface DirectoryPage {
  rows: DirectoryRow[];
  total: number;
  fxVersion: string | null;
}

// Whitelisted ORDER BY expressions: user input selects a key, never raw SQL.
const ORDER_BY: Record<EmployeeSortField, Prisma.Sql> = {
  name: Prisma.sql`e.last_name, e.first_name`,
  jobTitle: Prisma.sql`e.job_title`,
  hireDate: Prisma.sql`e.hire_date`,
  salaryUsd: Prisma.sql`salary_usd_cents`,
};

/** One page of the employee directory plus the total match count (AD-5, AD-6). */
export async function queryEmployeeDirectory(
  query: EmployeeListQuery,
): Promise<DirectoryPage> {
  const where = whereClause(query);
  const direction = query.order === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const offset = (query.page - 1) * query.pageSize;

  const rowsQuery = prisma.$queryRaw<DirectoryRow[]>`
    WITH ${activeFxVersionCte}
    SELECT
      e.id, e.employee_code, e.first_name, e.last_name, e.email, e.job_title,
      d.id AS department_id, d.name AS department_name,
      c.code AS country_code, c.name AS country_name,
      e.salary_minor, e.salary_currency, c.currency_exponent,
      ${salaryUsdCentsSql} AS salary_usd_cents,
      e.hire_date, e.terminated_at
    FROM employees e
    JOIN departments d ON d.id = e.department_id
    JOIN countries c ON c.code = e.country_code
    LEFT JOIN exchange_rates r
      ON r.currency_code = e.salary_currency
     AND r.version = (SELECT version FROM active_fx)
    ${where}
    ORDER BY ${ORDER_BY[query.sort]} ${direction} NULLS LAST, e.id ${direction}
    LIMIT ${query.pageSize} OFFSET ${offset}`;

  const countQuery = prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*) AS total FROM employees e ${where}`;

  const [rows, [count], fx] = await Promise.all([rowsQuery, countQuery, queryActiveFx()]);
  return { rows, total: Number(count?.total ?? 0), fxVersion: fx?.version ?? null };
}

function whereClause(query: EmployeeListQuery): Prisma.Sql {
  const conditions = employeeFilterConditions(query);

  if (!query.includeTerminated) {
    conditions.push(Prisma.sql`e.terminated_at IS NULL`);
  }
  if (query.q) {
    const pattern = `%${escapeLike(query.q)}%`;
    conditions.push(Prisma.sql`(
      e.first_name ILIKE ${pattern}
      OR e.last_name ILIKE ${pattern}
      OR (e.first_name || ' ' || e.last_name) ILIKE ${pattern}
      OR e.email ILIKE ${pattern}
      OR e.employee_code ILIKE ${pattern}
    )`);
  }

  return whereSql(conditions);
}
