import { z } from "zod";
import { employeeFiltersShape } from "./employee-filters";
import { paginationShape } from "./pagination";

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./pagination";

export const EMPLOYEE_SORT_FIELDS = [
  "name",
  "jobTitle",
  "hireDate",
  "salaryUsd",
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

/** Query string for GET /api/employees. Every field is optional with a safe default. */
export const employeeListQuerySchema = z.object({
  ...paginationShape,
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  ...employeeFiltersShape,
  includeTerminated: z.stringbool().default(false),
  sort: z.enum(EMPLOYEE_SORT_FIELDS).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
