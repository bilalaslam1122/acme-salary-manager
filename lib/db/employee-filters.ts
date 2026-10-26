import type { EmployeeFilters } from "@/lib/validation/employee-filters";
import { Prisma } from "./generated/prisma/client";

/** SQL conditions for the shared filters, against employees aliased as `e`. */
export function employeeFilterConditions(filters: EmployeeFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];
  if (filters.countryCode) {
    conditions.push(Prisma.sql`e.country_code = ${filters.countryCode}`);
  }
  if (filters.departmentId) {
    conditions.push(Prisma.sql`e.department_id = ${filters.departmentId}`);
  }
  if (filters.jobTitle) {
    conditions.push(Prisma.sql`e.job_title = ${filters.jobTitle}`);
  }
  return conditions;
}

/** `WHERE a AND b …`, or nothing when there are no conditions. */
export function whereSql(conditions: Prisma.Sql[]): Prisma.Sql {
  return conditions.length === 0
    ? Prisma.empty
    : Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}
