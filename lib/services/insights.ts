import "server-only";
import { queryActiveFx, type ActiveFx } from "@/lib/db/fx";
import {
  queryHistogramCounts,
  querySalaryStats,
  querySalaryStatsByGroup,
  queryUnconvertibleCount,
  type StatsRow,
} from "@/lib/db/insights";
import type { EmployeeFilters } from "@/lib/validation/employee-filters";
import type { InsightGroup } from "@/lib/validation/insights";
import { histogramLayout } from "./histogram";

/** Salary statistics in USD cents; amounts are null when headcount is 0. */
export interface SalaryStats {
  headcount: number;
  minUsdCents: number | null;
  maxUsdCents: number | null;
  avgUsdCents: number | null;
  medianUsdCents: number | null;
}

export interface GroupSalaryStats extends SalaryStats {
  key: string;
  label: string;
}

export interface HistogramBucket {
  fromUsdCents: number;
  /** Exclusive, except for the last bucket which includes the maximum. */
  toUsdCents: number;
  count: number;
}

export interface SalaryDistribution {
  bucketWidthUsdCents: number | null;
  buckets: HistogramBucket[];
}

export interface InsightsResult<T> {
  data: T;
  meta: { fx: ActiveFx | null };
}

export interface SalarySummary {
  data: SalaryStats;
  meta: {
    fx: ActiveFx | null;
    /** Active employees left out of every USD figure: their currency has no rate. */
    excludedWithoutFx: number;
  };
}

export async function getSalarySummary(filters: EmployeeFilters): Promise<SalarySummary> {
  const [row, fx, excludedWithoutFx] = await Promise.all([
    querySalaryStats(filters),
    queryActiveFx(),
    queryUnconvertibleCount(filters),
  ]);
  return { data: toStats(row), meta: { fx, excludedWithoutFx } };
}

export async function getSalaryByGroup(
  groupBy: InsightGroup,
  filters: EmployeeFilters,
): Promise<InsightsResult<GroupSalaryStats[]>> {
  const [rows, fx] = await Promise.all([
    querySalaryStatsByGroup(groupBy, filters),
    queryActiveFx(),
  ]);
  return {
    data: rows.map((row) => ({ key: row.key, label: row.label, ...toStats(row) })),
    meta: { fx },
  };
}

export async function getSalaryDistribution(
  filters: EmployeeFilters,
): Promise<InsightsResult<SalaryDistribution>> {
  const [stats, fx] = await Promise.all([querySalaryStats(filters), queryActiveFx()]);
  if (stats.min_usd_cents === null || stats.max_usd_cents === null) {
    return { data: { bucketWidthUsdCents: null, buckets: [] }, meta: { fx } };
  }

  const layout = histogramLayout(
    Number(stats.min_usd_cents),
    Number(stats.max_usd_cents),
  );
  const counts = await queryHistogramCounts(filters, layout);
  const countByBucket = new Map(counts.map((row) => [row.bucket, row.count]));

  // Fill empty buckets so the chart has a continuous x-axis.
  const buckets = Array.from({ length: layout.bucketCount }, (_, index) => ({
    fromUsdCents: layout.startCents + index * layout.widthCents,
    toUsdCents: layout.startCents + (index + 1) * layout.widthCents,
    count: countByBucket.get(index) ?? 0,
  }));

  return { data: { bucketWidthUsdCents: layout.widthCents, buckets }, meta: { fx } };
}

function toStats(row: StatsRow): SalaryStats {
  return {
    headcount: row.headcount,
    minUsdCents: toNumber(row.min_usd_cents),
    maxUsdCents: toNumber(row.max_usd_cents),
    avgUsdCents: toNumber(row.avg_usd_cents),
    medianUsdCents: toNumber(row.median_usd_cents),
  };
}

function toNumber(value: bigint | null): number | null {
  return value === null ? null : Number(value);
}
