import { describe, expect, it } from "vitest";
import { diffEmployee } from "./employee-changes";
import type { EmployeeDto } from "./employees";

const before: EmployeeDto = {
  id: 1,
  employeeCode: "ACME-00001",
  firstName: "Kenji",
  lastName: "Sato",
  email: "kenji@acme.example",
  jobTitle: "Software Engineer",
  department: { id: 1, name: "Engineering" },
  country: { code: "JP", name: "Japan" },
  salary: { amountMinor: 10_000_000, currency: "JPY", exponent: 0 },
  hireDate: "2024-03-01",
  terminatedAt: null,
  createdAt: "2024-03-01T00:00:00.000Z",
  updatedAt: "2024-03-01T00:00:00.000Z",
};

describe("diffEmployee", () => {
  it("returns nothing when no audited field changed", () => {
    expect(
      diffEmployee(before, { ...before, updatedAt: "2026-10-01T00:00:00.000Z" }),
    ).toEqual({});
  });

  it("records a promotion with readable before and after values", () => {
    const after = {
      ...before,
      jobTitle: "Senior Software Engineer",
      department: { id: 2, name: "Platform" },
    };
    expect(diffEmployee(before, after)).toEqual({
      "Job title": { from: "Software Engineer", to: "Senior Software Engineer" },
      Department: { from: "Engineering", to: "Platform" },
    });
  });

  it("records a country move by name", () => {
    const after = { ...before, country: { code: "GB", name: "United Kingdom" } };
    expect(diffEmployee(before, after)).toEqual({
      Country: { from: "Japan", to: "United Kingdom" },
    });
  });

  it("leaves salary to the salary history", () => {
    const after = { ...before, salary: { ...before.salary, amountMinor: 11_000_000 } };
    expect(diffEmployee(before, after)).toEqual({});
  });
});
