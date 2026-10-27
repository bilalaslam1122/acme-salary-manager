import { z } from "zod";
import { employeeFiltersShape } from "./employee-filters";
import { paginationShape } from "./pagination";

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./pagination";

export const EMPLOYEE_SORT_FIELDS = [
  "name",
  "jobTitle",
  "hireDate",
  "salaryUsd",
  "terminatedAt",
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

/** Which employees the directory lists. Active is the everyday view. */
export const EMPLOYEE_STATUSES = ["active", "terminated", "all"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

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
  status: z.enum(EMPLOYEE_STATUSES).default("active"),
  sort: z.enum(EMPLOYEE_SORT_FIELDS).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
