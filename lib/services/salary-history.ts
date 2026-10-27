import "server-only";
import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/lib/errors";
import type { Pagination } from "@/lib/validation/pagination";

export interface Money {
  amountMinor: number;
  currency: string;
  exponent: number;
}

export interface SalaryChangeDto {
  id: number;
  changedAt: string;
  /** Null for the initial salary. */
  oldSalary: Money | null;
  newSalary: Money;
  /** Percent change to one decimal; null for the initial salary or a currency change. */
  changePercent: number | null;
  reason: string | null;
  /** Null for system changes (seed/import). */
  changedBy: { id: number; name: string } | null;
}

export interface SalaryHistoryPage {
  data: SalaryChangeDto[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

/** An employee's salary changes, newest first. Terminated employees keep their history. */
export async function listSalaryHistory(
  employeeId: number,
  { page, pageSize }: Pagination,
): Promise<SalaryHistoryPage> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);

  const [rows, total, exponentByCurrency] = await Promise.all([
    prisma.salaryHistory.findMany({
      where: { employeeId },
      orderBy: [{ changedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { changedBy: { select: { id: true, name: true } } },
    }),
    prisma.salaryHistory.count({ where: { employeeId } }),
    currencyExponents(),
  ]);

  const money = (amountMinor: number, currency: string): Money => ({
    amountMinor,
    currency,
    exponent: exponentByCurrency.get(currency) ?? 2,
  });

  return {
    data: rows.map((row) => ({
      id: row.id,
      changedAt: row.changedAt.toISOString(),
      oldSalary:
        row.oldSalaryMinor === null
          ? null
          : money(row.oldSalaryMinor, row.oldCurrency ?? row.currency),
      newSalary: money(row.newSalaryMinor, row.currency),
      changePercent: changePercent(row),
      reason: row.reason,
      changedBy: row.changedBy,
    })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

function changePercent(row: {
  oldSalaryMinor: number | null;
  oldCurrency: string | null;
  newSalaryMinor: number;
  currency: string;
}): number | null {
  if (row.oldSalaryMinor === null || row.oldSalaryMinor === 0) return null;
  if (row.oldCurrency !== null && row.oldCurrency !== row.currency) return null;
  const percent = ((row.newSalaryMinor - row.oldSalaryMinor) / row.oldSalaryMinor) * 100;
  return Math.round(percent * 10) / 10;
}

/** Minor-unit exponent per currency, from the countries table (EUR is shared). */
async function currencyExponents(): Promise<Map<string, number>> {
  const countries = await prisma.country.findMany({
    select: { currencyCode: true, currencyExponent: true },
    distinct: ["currencyCode"],
  });
  return new Map(countries.map((c) => [c.currencyCode, c.currencyExponent]));
}
