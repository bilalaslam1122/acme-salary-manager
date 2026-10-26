import { z } from "zod";

/** Filters shared by the employee directory and insights (all optional, combinable). */
export const employeeFiltersShape = {
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use an ISO 3166 alpha-2 code")
    .optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  jobTitle: z.string().trim().min(1).max(100).optional(),
};

export const employeeFiltersSchema = z.object(employeeFiltersShape);

export type EmployeeFilters = z.infer<typeof employeeFiltersSchema>;
