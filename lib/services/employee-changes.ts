import type { EmployeeDto } from "./employees";

// A type alias, not an interface, so it is assignable to Prisma's JSON input type.
export type FieldChange = { from: string; to: string };

/** Display label → change. Keys are what the HR Manager sees, values are readable text. */
export type EmployeeChanges = Record<string, FieldChange>;

// Salary is deliberately absent: SalaryHistory is its audit trail.
const AUDITED_FIELDS: { label: string; read: (e: EmployeeDto) => string }[] = [
  { label: "First name", read: (e) => e.firstName },
  { label: "Last name", read: (e) => e.lastName },
  { label: "Email", read: (e) => e.email },
  { label: "Job title", read: (e) => e.jobTitle },
  { label: "Department", read: (e) => e.department.name },
  { label: "Country", read: (e) => e.country.name },
  { label: "Hire date", read: (e) => e.hireDate },
];

/**
 * The non-salary fields that differ between two snapshots of an employee, recorded
 * with names rather than ids so the audit trail still reads correctly if a
 * department is later renamed.
 */
export function diffEmployee(before: EmployeeDto, after: EmployeeDto): EmployeeChanges {
  const changes: EmployeeChanges = {};
  for (const { label, read } of AUDITED_FIELDS) {
    const from = read(before);
    const to = read(after);
    if (from !== to) changes[label] = { from, to };
  }
  return changes;
}
