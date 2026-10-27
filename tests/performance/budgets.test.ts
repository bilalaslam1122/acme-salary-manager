import { beforeAll, describe, expect, it } from "vitest";
import { listEmployees } from "@/lib/services/employee-directory";
import {
  getSalaryByGroup,
  getSalaryDistribution,
  getSalarySummary,
} from "@/lib/services/insights";
import { employeeListQuerySchema } from "@/lib/validation/employee-list";
import { generateDataset } from "@/prisma/seed/generate";
import { writeDataset } from "@/prisma/seed/write";
import { testPrisma } from "../integration/db";

// Goals 1 and 2 (project-overview.md), measured against the full 10,000-employee seed.
const DIRECTORY_BUDGET_MS = 300;
const INSIGHTS_BUDGET_MS = 500;

async function timed<T>(operation: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const started = performance.now();
  const result = await operation();
  return { result, ms: performance.now() - started };
}

beforeAll(async () => {
  await writeDataset(testPrisma, generateDataset());
  await listEmployees(employeeListQuerySchema.parse({})); // warm the connection pool
}, 60_000);

describe("employee directory at 10k rows", () => {
  const scenarios: Record<string, Record<string, string>> = {
    "default page": {},
    "deep page": { page: "150", pageSize: "50" },
    "sort by USD salary desc": { sort: "salaryUsd", order: "desc" },
    "search + filter + USD sort": { q: "an", countryCode: "US", sort: "salaryUsd" },
    "max page size": { pageSize: "100", sort: "hireDate", order: "desc" },
  };

  it.each(Object.entries(scenarios))(
    "%s responds within budget",
    async (_name, query) => {
      const { result, ms } = await timed(() =>
        listEmployees(employeeListQuerySchema.parse(query)),
      );
      expect(result.meta.total).toBeGreaterThan(0);
      expect(ms).toBeLessThan(DIRECTORY_BUDGET_MS);
    },
  );
});

describe("insights at 10k rows", () => {
  it("summary responds within budget", async () => {
    const { result, ms } = await timed(() => getSalarySummary({}));
    expect(result.data.headcount).toBe(10_000);
    expect(ms).toBeLessThan(INSIGHTS_BUDGET_MS);
  });

  it.each(["country", "department", "jobTitle"] as const)(
    "by %s responds within budget",
    async (groupBy) => {
      const { result, ms } = await timed(() => getSalaryByGroup(groupBy, {}));
      expect(result.data.length).toBeGreaterThan(0);
      expect(ms).toBeLessThan(INSIGHTS_BUDGET_MS);
    },
  );

  it("distribution responds within budget", async () => {
    const { result, ms } = await timed(() => getSalaryDistribution({}));
    expect(result.data.buckets.reduce((sum, b) => sum + b.count, 0)).toBe(10_000);
    expect(ms).toBeLessThan(INSIGHTS_BUDGET_MS);
  });
});
