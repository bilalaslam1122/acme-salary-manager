import "server-only";
import type { EmployeeFilters } from "@/lib/validation/employee-filters";
import type { InsightGroup } from "@/lib/validation/insights";
import { prisma } from "./client";
import { employeeFilterConditions, whereSql } from "./employee-filters";
import { activeFxVersionCte, salaryUsdCentsSql } from "./fx";
import { Prisma } from "./generated/prisma/client";

// All aggregation happens here, in SQL (Invariant 2, AD-3, AD-4).

export interface StatsRow {
  headcount: number;
  min_usd_cents: bigint | null;
  max_usd_cents: bigint | null;
  avg_usd_cents: bigint | null;
  median_usd_cents: bigint | null;
}

export interface GroupStatsRow extends StatsRow {
  key: string;
  label: string;
}

/**
 * Active employees with their salary in USD cents at the active FX version.
 * Inner join on rates: a currency without a rate cannot be compared in USD.
 */
function salariesCte(filters: EmployeeFilters): Prisma.Sql {
  const where = whereSql([
    Prisma.sql`e.terminated_at IS NULL`,
    ...employeeFilterConditions(filters),
  ]);
  return Prisma.sql`
    ${activeFxVersionCte},
    salaries AS (
      SELECT
        e.country_code, c.name AS country_name,
        e.department_id, d.name AS department_name,
        e.job_title,
        ${salaryUsdCentsSql} AS usd_cents
      FROM employees e
      JOIN countries c ON c.code = e.country_code
      JOIN departments d ON d.id = e.department_id
      JOIN exchange_rates r
        ON r.currency_code = e.salary_currency
       AND r.version = (SELECT version FROM active_fx)
      ${where}
    )`;
}

const STATS_COLUMNS = Prisma.sql`
  COUNT(*)::int AS headcount,
  MIN(usd_cents) AS min_usd_cents,
  MAX(usd_cents) AS max_usd_cents,
  ROUND(AVG(usd_cents))::bigint AS avg_usd_cents,
  ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY usd_cents))::bigint AS median_usd_cents`;

// Whitelisted grouping expressions: user input selects a key, never raw SQL.
const GROUP_KEYS: Record<InsightGroup, { key: Prisma.Sql; label: Prisma.Sql }> = {
  country: { key: Prisma.sql`country_code`, label: Prisma.sql`country_name` },
  department: {
    key: Prisma.sql`department_id::text`,
    label: Prisma.sql`department_name`,
  },
  jobTitle: { key: Prisma.sql`job_title`, label: Prisma.sql`job_title` },
};

export async function querySalaryStats(filters: EmployeeFilters): Promise<StatsRow> {
  const [row] = await prisma.$queryRaw<StatsRow[]>`
    WITH ${salariesCte(filters)}
    SELECT ${STATS_COLUMNS} FROM salaries`;
  return row!;
}

/** Stats per group, highest median first. */
export async function querySalaryStatsByGroup(
  groupBy: InsightGroup,
  filters: EmployeeFilters,
): Promise<GroupStatsRow[]> {
  const { key, label } = GROUP_KEYS[groupBy];
  return prisma.$queryRaw<GroupStatsRow[]>`
    WITH ${salariesCte(filters)}
    SELECT ${key} AS key, ${label} AS label, ${STATS_COLUMNS}
    FROM salaries
    GROUP BY ${key}, ${label}
    ORDER BY median_usd_cents DESC, key`;
}

/** Headcount per bucket index; values past the last edge land in the last bucket. */
export async function queryHistogramCounts(
  filters: EmployeeFilters,
  layout: { startCents: number; widthCents: number; bucketCount: number },
): Promise<{ bucket: number; count: number }[]> {
  return prisma.$queryRaw<{ bucket: number; count: number }[]>`
    WITH ${salariesCte(filters)}
    SELECT
      LEAST(
        FLOOR((usd_cents - ${layout.startCents}) / ${layout.widthCents}::numeric),
        ${layout.bucketCount - 1}
      )::int AS bucket,
      COUNT(*)::int AS count
    FROM salaries
    GROUP BY 1
    ORDER BY 1`;
}
