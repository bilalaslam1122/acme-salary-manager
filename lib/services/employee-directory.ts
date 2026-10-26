import "server-only";
import { queryEmployeeDirectory, type DirectoryRow } from "@/lib/db/employee-directory";
import type { EmployeeListQuery } from "@/lib/validation/employee-list";

export interface EmployeeListItem {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: { id: number; name: string };
  country: { code: string; name: string };
  salary: { amountMinor: number; currency: string; exponent: number };
  /** Salary converted at the active FX version; null if the currency has no rate. */
  salaryUsdCents: number | null;
  hireDate: string;
  terminatedAt: string | null;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  fxVersion: string | null;
}

export interface EmployeeListResult {
  data: EmployeeListItem[];
  meta: PageMeta;
}

export async function listEmployees(
  query: EmployeeListQuery,
): Promise<EmployeeListResult> {
  const { rows, total, fxVersion } = await queryEmployeeDirectory(query);
  return {
    data: rows.map(toListItem),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
      fxVersion,
    },
  };
}

function toListItem(row: DirectoryRow): EmployeeListItem {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    jobTitle: row.job_title,
    department: { id: row.department_id, name: row.department_name },
    country: { code: row.country_code, name: row.country_name },
    salary: {
      amountMinor: row.salary_minor,
      currency: row.salary_currency,
      exponent: row.currency_exponent,
    },
    salaryUsdCents: row.salary_usd_cents === null ? null : Number(row.salary_usd_cents),
    hireDate: row.hire_date.toISOString().slice(0, 10),
    terminatedAt: row.terminated_at?.toISOString() ?? null,
  };
}
