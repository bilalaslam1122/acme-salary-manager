import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/employees/[id]/history/route";
import {
  createEmployee,
  terminateEmployee,
  updateEmployee,
} from "@/lib/services/employees";
import { listSalaryHistory } from "@/lib/services/salary-history";
import { createEmployeeSchema } from "@/lib/validation/employee";
import { authed, signIn } from "./auth";
import { testPrisma } from "./db";
import { employeePayload, seedReferenceData } from "./factories";

const t0 = new Date("2024-03-01T09:00:00.000Z");
const t1 = new Date("2025-03-01T09:00:00.000Z");
const t2 = new Date("2026-03-01T09:00:00.000Z");
const firstPage = { page: 1, pageSize: 50 };

async function createGbEmployee(actorId: number | null = null) {
  const input = createEmployeeSchema.parse(
    await employeePayload({ countryCode: "GB", salaryMinor: 8_000_000 }),
  );
  return createEmployee(input, { actorId, now: t0 });
}

function historyRows(employeeId: number) {
  return testPrisma.salaryHistory.findMany({
    where: { employeeId },
    orderBy: { id: "asc" },
  });
}

beforeEach(async () => {
  await seedReferenceData();
  await signIn();
});

describe("listSalaryHistory", () => {
  it("returns changes newest first with money, percent and reason", async () => {
    const employee = await createGbEmployee();
    await updateEmployee(
      employee.id,
      { salaryMinor: 8_800_000, salaryChangeReason: "Annual review" },
      { actorId: null, now: t1 },
    );

    const { data } = await listSalaryHistory(employee.id, firstPage);

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      changedAt: t1.toISOString(),
      oldSalary: { amountMinor: 8_000_000, currency: "GBP", exponent: 2 },
      newSalary: { amountMinor: 8_800_000, currency: "GBP", exponent: 2 },
      changePercent: 10,
      reason: "Annual review",
      changedBy: null,
    });
    expect(data[1]).toMatchObject({
      changedAt: t0.toISOString(),
      oldSalary: null,
      changePercent: null,
      reason: "Initial salary",
    });
  });

  it("reports both currencies and no percent after a country move", async () => {
    const employee = await createGbEmployee();
    await updateEmployee(
      employee.id,
      { countryCode: "JP", salaryMinor: 15_000_000 },
      { actorId: null, now: t1 },
    );

    const [latest] = (await listSalaryHistory(employee.id, firstPage)).data;

    expect(latest).toMatchObject({
      oldSalary: { amountMinor: 8_000_000, currency: "GBP", exponent: 2 },
      newSalary: { amountMinor: 15_000_000, currency: "JPY", exponent: 0 },
      changePercent: null,
    });
  });

  it("records the user who made the change", async () => {
    const user = await testPrisma.user.create({
      data: { email: "hr@acme.example", name: "Hannah HR", passwordHash: "x" },
    });

    const employee = await createGbEmployee(user.id);

    const [initial] = (await listSalaryHistory(employee.id, firstPage)).data;
    expect(initial?.changedBy).toEqual({ id: user.id, name: "Hannah HR" });
  });

  it("paginates with total metadata", async () => {
    const employee = await createGbEmployee();
    await updateEmployee(
      employee.id,
      { salaryMinor: 8_500_000 },
      { actorId: null, now: t1 },
    );
    await updateEmployee(
      employee.id,
      { salaryMinor: 9_000_000 },
      { actorId: null, now: t2 },
    );

    const page2 = await listSalaryHistory(employee.id, { page: 2, pageSize: 2 });

    expect(page2.data.map((c) => c.newSalary.amountMinor)).toEqual([8_000_000]);
    expect(page2.meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
  });

  it("keeps history readable after termination", async () => {
    const employee = await createGbEmployee();
    await terminateEmployee(employee.id, { now: t1 });

    expect((await listSalaryHistory(employee.id, firstPage)).data).toHaveLength(1);
  });
});

describe("salary writes are atomic (Invariant 5)", () => {
  it("rolls back the salary update when the history insert fails", async () => {
    const employee = await createGbEmployee();

    // No user 99999 exists, so the history row's changed_by_id FK fails.
    await expect(
      updateEmployee(employee.id, { salaryMinor: 9_999_900 }, { actorId: 99_999 }),
    ).rejects.toThrow();

    const stored = await testPrisma.employee.findUniqueOrThrow({
      where: { id: employee.id },
    });
    expect(stored.salaryMinor).toBe(8_000_000);
    expect(await historyRows(employee.id)).toHaveLength(1);
  });

  it("creates no employee when the initial history insert fails", async () => {
    await expect(createGbEmployee(99_999)).rejects.toThrow();

    expect(await testPrisma.employee.count()).toBe(0);
    expect(await testPrisma.salaryHistory.count()).toBe(0);
  });

  it("keeps a consistent history chain under concurrent salary edits", async () => {
    const employee = await createGbEmployee();

    await Promise.all([
      updateEmployee(employee.id, { salaryMinor: 9_000_000 }, { actorId: null }),
      updateEmployee(employee.id, { salaryMinor: 9_500_000 }, { actorId: null }),
    ]);

    const rows = await historyRows(employee.id);
    const stored = await testPrisma.employee.findUniqueOrThrow({
      where: { id: employee.id },
    });
    expect(rows).toHaveLength(3);
    expect(rows[1]!.oldSalaryMinor).toBe(rows[0]!.newSalaryMinor);
    expect(rows[2]!.oldSalaryMinor).toBe(rows[1]!.newSalaryMinor);
    expect(rows[2]!.newSalaryMinor).toBe(stored.salaryMinor);
  });
});

describe("GET /api/employees/[id]/history", () => {
  const ctx = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });
  const request = (query = "") =>
    authed(`http://localhost/api/employees/1/history${query}`);

  it("returns data and pagination meta", async () => {
    const employee = await createGbEmployee();

    const response = await GET(request(), ctx(employee.id));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta).toMatchObject({ page: 1, total: 1 });
  });

  it("returns 404 for an unknown employee", async () => {
    const response = await GET(request(), ctx(424_242));
    expect(response.status).toBe(404);
  });

  it("returns 400 for a page size above the maximum", async () => {
    const employee = await createGbEmployee();
    const response = await GET(request("?pageSize=500"), ctx(employee.id));
    expect(response.status).toBe(400);
  });
});
