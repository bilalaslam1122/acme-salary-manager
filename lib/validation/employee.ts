import { z } from "zod";

/** Keeps salary_minor inside a Postgres int4 (see AD-1). */
export const MAX_SALARY_MINOR = 2_000_000_000;

const name = z.string().trim().min(1, "Required").max(100);

const isoDate = z.iso
  .date({ message: "Use the YYYY-MM-DD format" })
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const salaryMinor = z
  .number({ message: "Must be a number" })
  .int("Must be a whole number of minor units")
  .positive("Must be greater than zero")
  .max(MAX_SALARY_MINOR, "Exceeds the maximum supported salary");

export const employeeIdSchema = z.coerce
  .number({ message: "Invalid employee id" })
  .int("Invalid employee id")
  .positive("Invalid employee id");

export const createEmployeeSchema = z.strictObject({
  firstName: name,
  lastName: name,
  email: z.email().trim().toLowerCase().max(254),
  jobTitle: name,
  departmentId: z.number().int().positive(),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use an ISO 3166 alpha-2 code"),
  salaryMinor,
  hireDate: isoDate,
});

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .extend({
    /** Why the salary changed; stored on the SalaryHistory row. */
    salaryChangeReason: z.string().trim().min(1).max(500).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one field to update",
  })
  .refine((input) => input.countryCode === undefined || input.salaryMinor !== undefined, {
    message: "Changing country changes the salary currency, so salaryMinor is required",
    path: ["salaryMinor"],
  });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
