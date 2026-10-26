import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { generateDataset } from "@/prisma/seed/generate";
import { writeDataset } from "@/prisma/seed/write";
import { resetDatabase, testPrisma } from "./db";

const dataset = generateDataset({ employeeCount: 25 });

describe("writeDataset", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("writes every generated row", async () => {
    await writeDataset(testPrisma, dataset);

    expect(await testPrisma.country.count()).toBe(dataset.countries.length);
    expect(await testPrisma.department.count()).toBe(dataset.departments.length);
    expect(await testPrisma.exchangeRate.count()).toBe(dataset.exchangeRates.length);
    expect(await testPrisma.employee.count()).toBe(25);
    expect(await testPrisma.salaryHistory.count()).toBe(dataset.salaryHistory.length);
  });

  it("replaces existing data when run twice", async () => {
    await writeDataset(testPrisma, dataset);
    await writeDataset(testPrisma, dataset);

    expect(await testPrisma.employee.count()).toBe(25);
    expect(await testPrisma.salaryHistory.count()).toBe(dataset.salaryHistory.length);
  });

  it("advances id sequences past seeded ids so later inserts do not collide", async () => {
    await writeDataset(testPrisma, dataset);

    const created = await testPrisma.department.create({ data: { name: "Research" } });

    expect(created.id).toBe(dataset.departments.length + 1);
  });

  it("round-trips dates and money without loss", async () => {
    await writeDataset(testPrisma, dataset);
    const expected = dataset.employees[0]!;

    const stored = await testPrisma.employee.findUniqueOrThrow({
      where: { id: expected.id },
    });

    expect(stored.salaryMinor).toBe(expected.salaryMinor);
    expect(stored.hireDate).toEqual(expected.hireDate);
  });
});
