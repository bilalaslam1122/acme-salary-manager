import { z } from "zod";

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 50;

export const EMPLOYEE_SORT_FIELDS = [
  "name",
  "jobTitle",
  "hireDate",
  "salaryUsd",
] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

/** Query string for GET /api/employees. Every field is optional with a safe default. */
export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => (value ? value : undefined)),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use an ISO 3166 alpha-2 code")
    .optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  jobTitle: z.string().trim().min(1).max(100).optional(),
  includeTerminated: z.stringbool().default(false),
  sort: z.enum(EMPLOYEE_SORT_FIELDS).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
