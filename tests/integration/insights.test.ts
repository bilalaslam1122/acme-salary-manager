import { beforeEach, describe, expect, it } from "vitest";
import { GET as getByGroup } from "@/app/api/insights/by-group/route";
import { GET as getDistribution } from "@/app/api/insights/distribution/route";
import { GET as getSummary } from "@/app/api/insights/summary/route";
import {
  getSalaryByGroup,
  getSalaryDistribution,
  getSalarySummary,
} from "@/lib/services/insights";
import { generateDataset } from "@/prisma/seed/generate";
import { COUNTRIES, USD_PER_UNIT_MICROS } from "@/prisma/seed/reference-data";
import { writeDataset } from "@/prisma/seed/write";
import { authed, signIn } from "./auth";
import { testPrisma } from "./db";
import { departmentId, insertEmployee, seedReferenceData } from "./factories";

/*
 * Fixture, at FX 2026-10 (GBP 1.27, JPY 0.0067, INR 0.012 USD per unit):
 *   US  $60,000          →  6,000,000 cents   Engineering, Software Engineer
 *   US  $80,000          →  8,000,000 cents   Sales, Account Executive
 *   GB  £50,000          →  6,350,000 cents   Engineering, Software Engineer
 *   JP  ¥10,000,000      →  6,700,000 cents   Engineering, Software Engineer
 *   IN  ₹3,000,000       →  3,600,000 cents   Engineering, Software Engineer
 *   US  $1,000,000 (terminated, must be excluded)
 */
async function insertFixture() {
  await insertEmployee({ countryCode: "US", salaryMinor: 6_000_000 });
  await insertEmployee({
    countryCode: "US",
    salaryMinor: 8_000_000,
    department: "Sales",
    jobTitle: "Account Executive",
  });
  await insertEmployee({ countryCode: "GB", salaryMinor: 5_000_000 });
  await insertEmployee({ countryCode: "JP", salaryMinor: 10_000_000 });
  await insertEmployee({ countryCode: "IN", salaryMinor: 300_000_000 });
  await insertEmployee({
    countryCode: "US",
    salaryMinor: 100_000_000,
    terminatedAt: new Date("2026-01-01"),
  });
}

beforeEach(async () => {
  await seedReferenceData();
  await signIn();
});

describe("getSalarySummary", () => {
  beforeEach(insertFixture);

  it("aggregates active employees in USD cents", async () => {
    const { data } = await getSalarySummary({});
    expect(data).toEqual({
      headcount: 5,
      minUsdCents: 3_600_000,
      maxUsdCents: 8_000_000,
      avgUsdCents: 6_130_000, // 30,650,000 / 5
      medianUsdCents: 6_350_000, // middle of 3.6M, 6.0M, 6.35M, 6.7M, 8.0M
    });
  });

  it("applies filters", async () => {
    const { data } = await getSalarySummary({ jobTitle: "Account Executive" });
    expect(data).toMatchObject({ headcount: 1, medianUsdCents: 8_000_000 });
  });

  it("returns zero headcount and null amounts when nothing matches", async () => {
    const { data } = await getSalarySummary({ countryCode: "SG" });
    expect(data).toEqual({
      headcount: 0,
      minUsdCents: null,
      maxUsdCents: null,
      avgUsdCents: null,
      medianUsdCents: null,
    });
  });

  it("reports the FX version used", async () => {
    const { meta } = await getSalarySummary({});
    expect(meta.fx).toEqual({ version: "2026-10", effectiveDate: "2026-10-01" });
  });
});

describe("getSalaryByGroup", () => {
  beforeEach(insertFixture);

  it("groups by country, highest median first, with headcount", async () => {
    const { data } = await getSalaryByGroup("country", {});
    expect(data.map((g) => [g.key, g.headcount, g.medianUsdCents])).toEqual([
      ["US", 2, 7_000_000], // even count: average of the two middle values
      ["JP", 1, 6_700_000],
      ["GB", 1, 6_350_000],
      ["IN", 1, 3_600_000],
    ]);
  });

  it("labels country groups with the country name", async () => {
    const { data } = await getSalaryByGroup("country", {});
    expect(data.find((g) => g.key === "GB")?.label).toBe("United Kingdom");
  });

  it("groups by department using the department id as key", async () => {
    const { data } = await getSalaryByGroup("department", {});
    const sales = await departmentId("Sales");
    expect(data.find((g) => g.label === "Sales")).toMatchObject({
      key: String(sales),
      headcount: 1,
    });
  });

  it("compares one job title across countries in USD", async () => {
    const { data } = await getSalaryByGroup("country", { jobTitle: "Software Engineer" });
    expect(data.map((g) => g.key)).toEqual(["JP", "GB", "US", "IN"]);
    expect(data.find((g) => g.key === "US")?.headcount).toBe(1);
  });
});

describe("getSalaryDistribution", () => {
  it("buckets salaries into $5k-aligned bins with empty bins filled", async () => {
    await insertFixture();

    const { data } = await getSalaryDistribution({});

    // Range $36k–$80k → start $35k, width $5k, 10 buckets.
    expect(data.bucketWidthUsdCents).toBe(500_000);
    expect(data.buckets).toHaveLength(10);
    expect(data.buckets[0]).toEqual({
      fromUsdCents: 3_500_000,
      toUsdCents: 4_000_000,
      count: 1,
    });
    expect(data.buckets.map((b) => b.count)).toEqual([1, 0, 0, 0, 0, 2, 1, 0, 0, 1]);
  });

  it("returns no buckets when nothing matches", async () => {
    const { data } = await getSalaryDistribution({ countryCode: "SG" });
    expect(data).toEqual({ bucketWidthUsdCents: null, buckets: [] });
  });
});

describe("insights SQL against an independent JS calculation", () => {
  it("matches headcount, min, max, avg and median per country on generated data", async () => {
    const dataset = generateDataset({ seed: 7, employeeCount: 300 });
    await writeDataset(testPrisma, dataset);
    const exponentByCurrency = new Map(
      COUNTRIES.map((c) => [c.currencyCode, c.currencyExponent]),
    );
    const usdCents = (minor: number, currency: string) =>
      Math.round(
        (minor * USD_PER_UNIT_MICROS[currency]!) /
          (10 ** exponentByCurrency.get(currency)! * 10_000),
      );

    const expected = [...Map.groupBy(dataset.employees, (e) => e.countryCode)].map(
      ([country, employees]) => {
        const values = employees
          .map((e) => usdCents(e.salaryMinor, e.salaryCurrency))
          .sort((a, b) => a - b);
        const mid = values.length / 2;
        const median = Number.isInteger(mid)
          ? Math.round((values[mid - 1]! + values[mid]!) / 2)
          : values[Math.floor(mid)]!;
        return {
          key: country,
          headcount: values.length,
          minUsdCents: values[0],
          maxUsdCents: values.at(-1),
          avgUsdCents: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
          medianUsdCents: median,
        };
      },
    );

    const { data } = await getSalaryByGroup("country", {});
    const actual = data.map(({ label: _label, ...stats }) => stats);
    expect(actual).toEqual(expect.arrayContaining(expected));
    expect(actual).toHaveLength(expected.length);
  });
});

describe("insights API", () => {
  beforeEach(insertFixture);

  const get = (handler: (r: Request) => Promise<Response>, query: string) =>
    handler(authed(`http://localhost/api/insights?${query}`));

  it("GET /api/insights/summary returns data and FX meta", async () => {
    const response = await get(getSummary, "countryCode=us");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.headcount).toBe(2);
    expect(body.meta.fx.version).toBe("2026-10");
  });

  it("GET /api/insights/by-group requires a valid groupBy", async () => {
    const response = await get(getByGroup, "groupBy=salary");
    expect(response.status).toBe(400);
    expect((await response.json()).error.details.fieldErrors).toHaveProperty("groupBy");
  });

  it("GET /api/insights/by-group returns one row per group", async () => {
    const response = await get(getByGroup, "groupBy=jobTitle");
    expect((await response.json()).data).toHaveLength(2);
  });

  it("GET /api/insights/distribution returns buckets", async () => {
    const response = await get(getDistribution, "");
    expect(response.status).toBe(200);
    expect((await response.json()).data.buckets.length).toBeGreaterThan(0);
  });
});
