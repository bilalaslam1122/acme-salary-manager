import { beforeAll, describe, expect, it } from "vitest";
import { listEmployees } from "@/lib/services/employee-directory";
import { employeeListQuerySchema } from "@/lib/validation/employee-list";
import { generateDataset } from "@/prisma/seed/generate";
import { writeDataset } from "@/prisma/seed/write";
import { testPrisma } from "./db";

// Goal 1 (project-overview.md): any directory page in < 300 ms at 10,000 employees.
const BUDGET_MS = 300;

const scenarios: Record<string, Record<string, string>> = {
  "default page": {},
  "deep page": { page: "150", pageSize: "50" },
  "sort by USD salary desc": { sort: "salaryUsd", order: "desc" },
  "search + filter + USD sort": { q: "an", countryCode: "US", sort: "salaryUsd" },
  "max page size": { pageSize: "100", sort: "hireDate", order: "desc" },
};

describe("employee directory performance at 10k rows", () => {
  beforeAll(async () => {
    await writeDataset(testPrisma, generateDataset());
    await listEmployees(employeeListQuerySchema.parse({})); // warm the connection pool
  }, 60_000);

  it.each(Object.entries(scenarios))(
    "%s responds within budget",
    async (_name, query) => {
      const started = performance.now();
      const result = await listEmployees(employeeListQuerySchema.parse(query));
      const elapsed = performance.now() - started;

      expect(result.meta.total).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(BUDGET_MS);
    },
  );
});
