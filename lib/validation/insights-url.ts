import { z } from "zod";
import { employeeFiltersShape, type EmployeeFilters } from "./employee-filters";
import { INSIGHT_GROUPS } from "./insights";

/** Insights page URL: one filter row scopes every chart, plus the "Salary by…" tab. */
export const insightsPageQuerySchema = z.object({
  groupBy: z.enum(INSIGHT_GROUPS).default("country"),
  ...employeeFiltersShape,
});

export type InsightsPageQuery = z.infer<typeof insightsPageQuerySchema>;

const DEFAULTS = insightsPageQuerySchema.parse({});
const KEY_ORDER = Object.keys(
  insightsPageQuerySchema.shape,
) as (keyof InsightsPageQuery)[];

type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Invalid or tampered URLs fall back to defaults instead of erroring the page. */
export function parseInsightsQuery(searchParams: SearchParamsRecord): InsightsPageQuery {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const result = insightsPageQuerySchema.safeParse(flat);
  return result.success ? result.data : DEFAULTS;
}

/** Canonical `/insights?…` URL (fixed key order, defaults omitted). */
export function insightsHref(
  query: InsightsPageQuery,
  overrides: Partial<InsightsPageQuery> = {},
): string {
  const next: Partial<InsightsPageQuery> = { ...query, ...overrides };
  const params = new URLSearchParams();
  for (const key of KEY_ORDER) {
    const value = next[key];
    if (value === undefined || value === "" || value === DEFAULTS[key]) continue;
    params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `/insights?${search}` : "/insights";
}

export function filtersOf(query: InsightsPageQuery): EmployeeFilters {
  const { countryCode, departmentId, jobTitle } = query;
  return { countryCode, departmentId, jobTitle };
}

export function hasFilters(query: InsightsPageQuery): boolean {
  return Boolean(query.countryCode || query.departmentId || query.jobTitle);
}

/** CSV of the "Salary by…" table for the current grouping and filters. */
export function insightsExportHref(query: InsightsPageQuery): string {
  const params = new URLSearchParams({ groupBy: query.groupBy });
  const filters = filtersOf(query);
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `/api/insights/by-group/export?${params}`;
}
