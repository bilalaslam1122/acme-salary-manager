import "server-only";
import { minorToDecimal, toCsv, UTF8_BOM, type CsvColumn } from "@/lib/csv";
import {
  queryEmployeeDirectoryExport,
  type DirectoryRow,
} from "@/lib/db/employee-directory";
import { ValidationError } from "@/lib/errors";
import type { EmployeeFilters } from "@/lib/validation/employee-filters";
import type { EmployeeListQuery } from "@/lib/validation/employee-list";
import type { InsightGroup } from "@/lib/validation/insights";
import { getSalaryByGroup, type GroupSalaryStats } from "./insights";

/** Well above the org size; a guard against an export that would never finish. */
export const EXPORT_MAX_ROWS = 50_000;

export interface CsvFile {
  filename: string;
  /** UTF-8 with a BOM, so Excel shows names and currency symbols correctly. */
  content: string;
}

const usd = (cents: number | null) => (cents === null ? null : minorToDecimal(cents, 2));
const day = (now: Date) => now.toISOString().slice(0, 10);

/** The directory view as a spreadsheet: same search, filters and sort, every page. */
export async function exportEmployeesCsv(
  query: EmployeeListQuery,
  now: Date = new Date(),
): Promise<CsvFile> {
  // One extra row tells "exactly at the cap" apart from "would be truncated".
  const { rows, fxVersion } = await queryEmployeeDirectoryExport(
    query,
    EXPORT_MAX_ROWS + 1,
  );
  if (rows.length > EXPORT_MAX_ROWS) {
    throw new ValidationError("Too many employees to export", {
      _root: `Narrow the filters to at most ${EXPORT_MAX_ROWS.toLocaleString("en-US")} employees.`,
    });
  }

  const columns: CsvColumn<DirectoryRow>[] = [
    { header: "Employee code", value: (r) => r.employee_code },
    { header: "First name", value: (r) => r.first_name },
    { header: "Last name", value: (r) => r.last_name },
    { header: "Email", value: (r) => r.email },
    { header: "Job title", value: (r) => r.job_title },
    { header: "Department", value: (r) => r.department_name },
    { header: "Country", value: (r) => r.country_name },
    { header: "Currency", value: (r) => r.salary_currency },
    {
      header: "Annual salary",
      value: (r) => minorToDecimal(r.salary_minor, r.currency_exponent),
    },
    {
      header: `Annual salary USD (FX ${fxVersion ?? "n/a"})`,
      value: (r) => usd(r.salary_usd_cents === null ? null : Number(r.salary_usd_cents)),
    },
    { header: "Hire date", value: (r) => r.hire_date.toISOString().slice(0, 10) },
    { header: "Status", value: (r) => (r.terminated_at ? "Terminated" : "Active") },
    {
      header: "Terminated on",
      value: (r) => r.terminated_at?.toISOString().slice(0, 10) ?? null,
    },
  ];

  return {
    filename: `acme-employees-${query.status}-${day(now)}.csv`,
    content: UTF8_BOM + toCsv(columns, rows),
  };
}

const GROUP_HEADER: Record<InsightGroup, string> = {
  country: "Country",
  department: "Department",
  jobTitle: "Job title",
};

const GROUP_SLUG: Record<InsightGroup, string> = {
  country: "country",
  department: "department",
  jobTitle: "job-title",
};

/** The insights group table (min, median, average, max in USD) as a spreadsheet. */
export async function exportSalaryByGroupCsv(
  groupBy: InsightGroup,
  filters: EmployeeFilters,
  now: Date = new Date(),
): Promise<CsvFile> {
  const { data, meta } = await getSalaryByGroup(groupBy, filters);
  const fx = meta.fx ? `FX ${meta.fx.version}` : "no FX rates";

  const columns: CsvColumn<GroupSalaryStats>[] = [
    { header: GROUP_HEADER[groupBy], value: (r) => r.label },
    { header: "Headcount", value: (r) => r.headcount },
    { header: `Min salary USD (${fx})`, value: (r) => usd(r.minUsdCents) },
    { header: `Median salary USD (${fx})`, value: (r) => usd(r.medianUsdCents) },
    { header: `Average salary USD (${fx})`, value: (r) => usd(r.avgUsdCents) },
    { header: `Max salary USD (${fx})`, value: (r) => usd(r.maxUsdCents) },
  ];

  return {
    filename: `acme-salary-by-${GROUP_SLUG[groupBy]}-${day(now)}.csv`,
    content: UTF8_BOM + toCsv(columns, data),
  };
}
