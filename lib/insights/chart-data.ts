import { formatUsdCompact } from "@/lib/money/format";
import type { GroupSalaryStats, HistogramBucket } from "@/lib/services/insights";

// Pure shaping of insights API data into chart rows. Charts plot whole dollars;
// the exact cents stay in the tooltips and table views.

export interface GroupBarRow {
  key: string;
  label: string;
  medianUsd: number;
  headcount: number;
}

/** Groups with salaries, in the API's order (highest median first). */
export function medianRows(groups: GroupSalaryStats[]): GroupBarRow[] {
  return groups
    .filter((group) => group.medianUsdCents !== null)
    .map((group) => ({
      key: group.key,
      label: group.label,
      medianUsd: Math.round(group.medianUsdCents! / 100),
      headcount: group.headcount,
    }));
}

/** Headcount per group, largest first, so the longest bar leads. */
export function headcountRows(groups: GroupSalaryStats[]): GroupBarRow[] {
  return medianRows(groups).sort(
    (a, b) => b.headcount - a.headcount || a.label.localeCompare(b.label),
  );
}

export interface HistogramRow {
  /** Short x-axis label: the bucket's lower edge, e.g. "$35K". */
  label: string;
  /** Full range for tooltips and the table, e.g. "$35K–$40K". */
  range: string;
  count: number;
}

export function histogramRows(buckets: HistogramBucket[]): HistogramRow[] {
  return buckets.map((bucket) => ({
    label: formatUsdCompact(bucket.fromUsdCents),
    range: `${formatUsdCompact(bucket.fromUsdCents)}–${formatUsdCompact(bucket.toUsdCents)}`,
    count: bucket.count,
  }));
}

/** Row height for horizontal bar charts: bars ≤ 24px plus air (marks-and-anatomy). */
export const BAR_ROW_HEIGHT = 32;
export const X_AXIS_BAND = 32;

/** Container height that includes the axis band, so it never needs a nested scroll. */
export function horizontalChartHeight(rowCount: number): number {
  return Math.max(rowCount, 1) * BAR_ROW_HEIGHT + X_AXIS_BAND;
}
