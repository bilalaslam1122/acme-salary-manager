import {
  employeeListQuerySchema,
  type EmployeeListQuery,
  type EmployeeSortField,
} from "./employee-list";

const DEFAULTS = employeeListQuerySchema.parse({});
/** Fixed key order, so the same view always has the same URL. */
const KEY_ORDER = Object.keys(
  employeeListQuerySchema.shape,
) as (keyof EmployeeListQuery)[];

type SearchParamsRecord = Record<string, string | string[] | undefined>;

/**
 * Parses page `searchParams` with the same schema as GET /api/employees. An invalid
 * or tampered URL falls back to defaults instead of erroring the page.
 */
export function parseDirectoryQuery(searchParams: SearchParamsRecord): EmployeeListQuery {
  const flat = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const result = employeeListQuerySchema.safeParse(flat);
  return result.success ? result.data : DEFAULTS;
}

/** `/employees?…` for the query with overrides applied; default values are omitted. */
export function directoryHref(
  query: EmployeeListQuery,
  overrides: Partial<EmployeeListQuery> = {},
): string {
  const next: Partial<EmployeeListQuery> = { ...query, ...overrides };
  const params = new URLSearchParams();
  for (const key of KEY_ORDER) {
    const value = next[key];
    if (value === undefined || value === "" || value === DEFAULTS[key]) continue;
    params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `/employees?${search}` : "/employees";
}

/** Clicking a sorted column flips direction; a new column starts ascending. */
export function sortHref(query: EmployeeListQuery, field: EmployeeSortField): string {
  const order = query.sort === field && query.order === "asc" ? "desc" : "asc";
  return directoryHref(query, { sort: field, order, page: 1 });
}
