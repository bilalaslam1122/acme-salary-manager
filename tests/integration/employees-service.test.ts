import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  createEmployee,
  getEmployee,
  terminateEmployee,
  updateEmployee,
} from "@/lib/services/employees";
import { createEmployeeSchema } from "@/lib/validation/employee";
import { testPrisma } from "./db";
import { employeePayload, seedReferenceData } from "./factories";

const now = new Date("2026-10-20T09:30:00.000Z");
const system = { actorId: null, now };

async function create(overrides: Record<string, unknown> = {}) {
  return createEmployee(
    createEmployeeSchema.parse(await employeePayload(overrides)),
    system,
  );
}

function historyFor(employeeId: number) {
  return testPrisma.salaryHistory.findMany({
    where: { employeeId },
    orderBy: { id: "asc" },
  });
}

beforeEach(async () => {
  await seedReferenceData();
});

describe("createEmployee", () => {
  it("derives the salary currency from the country", async () => {
    const employee = await create({ countryCode: "JP", salaryMinor: 9_000_000 });
    expect(employee.salary).toEqual({
      amountMinor: 9_000_000,
      currency: "JPY",
      exponent: 0,
    });
  });

  it("assigns an employee code from the new id", async () => {
    const employee = await create();
    expect(employee.employeeCode).toBe(`ACME-${String(employee.id).padStart(5, "0")}`);
  });

  it("writes the initial salary as the first SalaryHistory row", async () => {
    const employee = await create({ salaryMinor: 7_250_000 });

    const history = await historyFor(employee.id);

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      oldSalaryMinor: null,
      oldCurrency: null,
      newSalaryMinor: 7_250_000,
      currency: "GBP",
      changedAt: now,
    });
  });

  it("rejects a duplicate email with ConflictError", async () => {
    await create({ email: "dup@acme.example" });
    await expect(create({ email: "dup@acme.example" })).rejects.toThrow(ConflictError);
  });

  it("rejects unknown department and country with field errors", async () => {
    const attempt = create({ departmentId: 999, countryCode: "ZZ" });
    await expect(attempt).rejects.toThrow(ValidationError);
    await expect(attempt).rejects.toMatchObject({
      fieldErrors: { departmentId: "Unknown department", countryCode: "Unknown country" },
    });
  });

  it("leaves no rows behind when creation fails", async () => {
    await create({ email: "dup@acme.example" });
    await create({ email: "dup@acme.example" }).catch(() => {});
    expect(await testPrisma.employee.count()).toBe(1);
    expect(await testPrisma.salaryHistory.count()).toBe(1);
  });
});

describe("updateEmployee", () => {
  it("records old and new salary with the reason when the salary changes", async () => {
    const employee = await create({ salaryMinor: 8_000_000 });

    await updateEmployee(
      employee.id,
      { salaryMinor: 8_800_000, salaryChangeReason: "Promotion" },
      system,
    );

    const history = await historyFor(employee.id);
    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({
      oldSalaryMinor: 8_000_000,
      oldCurrency: "GBP",
      newSalaryMinor: 8_800_000,
      currency: "GBP",
      reason: "Promotion",
    });
  });

  it("does not write history when only non-salary fields change", async () => {
    const employee = await create();

    const updated = await updateEmployee(
      employee.id,
      { jobTitle: "Staff Engineer" },
      system,
    );

    expect(updated.jobTitle).toBe("Staff Engineer");
    expect(await historyFor(employee.id)).toHaveLength(1);
  });

  it("does not write history when the salary is set to its current value", async () => {
    const employee = await create({ salaryMinor: 8_000_000 });
    await updateEmployee(employee.id, { salaryMinor: 8_000_000 }, system);
    expect(await historyFor(employee.id)).toHaveLength(1);
  });

  it("switches currency and records both currencies when the country changes", async () => {
    const employee = await create({ countryCode: "GB", salaryMinor: 8_000_000 });

    const updated = await updateEmployee(
      employee.id,
      { countryCode: "DE", salaryMinor: 9_000_000 },
      system,
    );

    expect(updated.salary.currency).toBe("EUR");
    expect((await historyFor(employee.id))[1]).toMatchObject({
      oldSalaryMinor: 8_000_000,
      oldCurrency: "GBP",
      newSalaryMinor: 9_000_000,
      currency: "EUR",
    });
  });

  it("rejects a salary change reason without a salary change", async () => {
    const employee = await create();
    await expect(
      updateEmployee(employee.id, { salaryChangeReason: "Promotion" }, system),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects changes to a terminated employee", async () => {
    const employee = await create();
    await terminateEmployee(employee.id, { now });
    await expect(
      updateEmployee(employee.id, { jobTitle: "Staff Engineer" }, system),
    ).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError for an unknown employee", async () => {
    await expect(updateEmployee(999, { jobTitle: "X" }, system)).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("terminateEmployee", () => {
  it("sets terminatedAt and keeps the employee and history", async () => {
    const employee = await create();

    await terminateEmployee(employee.id, { now });

    expect((await getEmployee(employee.id)).terminatedAt).toBe(now.toISOString());
    expect(await historyFor(employee.id)).toHaveLength(1);
  });

  it("rejects terminating twice", async () => {
    const employee = await create();
    await terminateEmployee(employee.id, { now });
    await expect(terminateEmployee(employee.id, { now })).rejects.toThrow(ConflictError);
  });
});

describe("getEmployee", () => {
  it("throws NotFoundError for an unknown id", async () => {
    await expect(getEmployee(12345)).rejects.toThrow(NotFoundError);
  });
});
