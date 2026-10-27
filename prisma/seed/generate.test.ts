import { beforeAll, describe, expect, it } from "vitest";
import { MAX_SALARY_MINOR } from "../../lib/validation/employee";
import { generateDataset, type Dataset } from "./generate";
import { COUNTRIES, REFERENCE_DATE, USD_PER_UNIT_MICROS } from "./reference-data";

describe("generateDataset", () => {
  let dataset: Dataset;

  beforeAll(() => {
    dataset = generateDataset();
  });

  it("generates 10,000 active and 400 former employees by default", () => {
    const active = dataset.employees.filter((e) => e.terminatedAt === null);
    expect(active).toHaveLength(10_000);
    expect(dataset.employees).toHaveLength(10_400);
  });

  it("terminates former employees after hire, on or before the reference date", () => {
    const former = dataset.employees.filter((e) => e.terminatedAt !== null);
    for (const employee of former) {
      const terminatedAt = new Date(employee.terminatedAt!);
      expect(terminatedAt.getTime()).toBeGreaterThan(
        new Date(employee.hireDate).getTime(),
      );
      expect(terminatedAt.getTime()).toBeLessThanOrEqual(REFERENCE_DATE.getTime());
    }
  });

  it("records no salary change after an employee left", () => {
    const terminatedAtById = new Map(
      dataset.employees
        .filter((e) => e.terminatedAt !== null)
        .map((e) => [e.id!, new Date(e.terminatedAt!).getTime()]),
    );
    for (const row of dataset.salaryHistory) {
      const terminatedAt = terminatedAtById.get(row.employeeId);
      if (terminatedAt === undefined) continue;
      expect(new Date(row.changedAt).getTime()).toBeLessThanOrEqual(terminatedAt);
    }
  });

  it("keeps active employees identical whatever the attrition", () => {
    const withoutFormer = generateDataset({ employeeCount: 50, formerEmployeeCount: 0 });
    const withFormer = generateDataset({ employeeCount: 50, formerEmployeeCount: 5 });
    expect(withFormer.employees.slice(0, 50)).toEqual(withoutFormer.employees);
  });

  it("produces identical data for the same seed", () => {
    expect(generateDataset({ employeeCount: 200 })).toEqual(
      generateDataset({ employeeCount: 200 }),
    );
  });

  it("produces different data for a different seed", () => {
    const a = generateDataset({ seed: 1, employeeCount: 50 });
    const b = generateDataset({ seed: 2, employeeCount: 50 });
    expect(a.employees).not.toEqual(b.employees);
  });

  it("gives every employee a unique email and employee code", () => {
    const emails = new Set(dataset.employees.map((e) => e.email));
    const codes = new Set(dataset.employees.map((e) => e.employeeCode));
    expect(emails.size).toBe(dataset.employees.length);
    expect(codes.size).toBe(dataset.employees.length);
  });

  it("pays every employee in their country's currency", () => {
    const currencyByCountry = new Map(COUNTRIES.map((c) => [c.code, c.currencyCode]));
    for (const employee of dataset.employees) {
      expect(employee.salaryCurrency).toBe(currencyByCountry.get(employee.countryCode));
    }
  });

  it("stores salaries as positive integers that fit in a Postgres int4", () => {
    for (const { salaryMinor } of dataset.employees) {
      expect(Number.isInteger(salaryMinor)).toBe(true);
      expect(salaryMinor).toBeGreaterThan(0);
      expect(salaryMinor).toBeLessThanOrEqual(MAX_SALARY_MINOR);
    }
  });

  it("has an FX rate for every employee currency", () => {
    const rated = new Set(dataset.exchangeRates.map((r) => r.currencyCode));
    for (const country of COUNTRIES) {
      expect(rated.has(country.currencyCode)).toBe(true);
    }
    expect(dataset.exchangeRates).toHaveLength(Object.keys(USD_PER_UNIT_MICROS).length);
  });

  it("starts every employee's history with an initial salary at hire", () => {
    const firstByEmployee = new Map<number, Dataset["salaryHistory"][number]>();
    for (const row of dataset.salaryHistory) {
      if (!firstByEmployee.has(row.employeeId)) firstByEmployee.set(row.employeeId, row);
    }
    expect(firstByEmployee.size).toBe(dataset.employees.length);
    for (const employee of dataset.employees) {
      const first = firstByEmployee.get(employee.id!);
      expect(first?.oldSalaryMinor).toBeNull();
      expect(first?.oldCurrency).toBeNull();
      expect(first?.changedAt).toEqual(employee.hireDate);
    }
  });

  it("chains history rows so each change starts from the previous salary and ends at the current one", () => {
    const rowsByEmployee = Map.groupBy(dataset.salaryHistory, (row) => row.employeeId);
    for (const employee of dataset.employees) {
      const rows = rowsByEmployee.get(employee.id!) ?? [];
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i]!.oldSalaryMinor).toBe(rows[i - 1]!.newSalaryMinor);
        expect(rows[i]!.oldCurrency).toBe(rows[i - 1]!.currency);
        expect(new Date(rows[i]!.changedAt).getTime()).toBeGreaterThan(
          new Date(rows[i - 1]!.changedAt).getTime(),
        );
      }
      expect(rows.at(-1)?.newSalaryMinor).toBe(employee.salaryMinor);
    }
  });

  it("records every past change as a raise", () => {
    for (const row of dataset.salaryHistory) {
      if (row.oldSalaryMinor !== null && row.oldSalaryMinor !== undefined) {
        expect(row.newSalaryMinor).toBeGreaterThan(row.oldSalaryMinor);
      }
    }
  });
});
