import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/employees/route";
import { listEmployees } from "@/lib/services/employee-directory";
import { employeeListQuerySchema } from "@/lib/validation/employee-list";
import { authed, signIn } from "./auth";
import { departmentId, insertEmployee, seedReferenceData } from "./factories";

function list(query: Record<string, string> = {}) {
  return listEmployees(employeeListQuerySchema.parse(query));
}

function lastNames(result: Awaited<ReturnType<typeof list>>) {
  return result.data.map((employee) => employee.lastName);
}

beforeEach(async () => {
  await seedReferenceData();
  await signIn();
});

describe("listEmployees pagination", () => {
  beforeEach(async () => {
    for (const lastName of ["Adams", "Baker", "Clark", "Davis", "Evans"]) {
      await insertEmployee({ lastName });
    }
  });

  it("returns the requested page and total metadata", async () => {
    const result = await list({ page: "2", pageSize: "2" });

    expect(lastNames(result)).toEqual(["Clark", "Davis"]);
    expect(result.meta).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 });
  });

  it("returns an empty page past the end with the real total", async () => {
    const result = await list({ page: "9", pageSize: "2" });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(5);
  });

  it("reports the active FX version", async () => {
    expect((await list()).meta.fxVersion).toBe("2026-10");
  });
});

describe("listEmployees search", () => {
  beforeEach(async () => {
    await insertEmployee({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@acme.example",
    });
    await insertEmployee({
      firstName: "Alan",
      lastName: "Turing",
      email: "alan@acme.example",
    });
  });

  it("matches names case-insensitively", async () => {
    expect(lastNames(await list({ q: "hOpPeR" }))).toEqual(["Hopper"]);
  });

  it("matches a full name across first and last name", async () => {
    expect(lastNames(await list({ q: "grace hop" }))).toEqual(["Hopper"]);
  });

  it("matches email", async () => {
    expect(lastNames(await list({ q: "alan@" }))).toEqual(["Turing"]);
  });

  it("matches employee code", async () => {
    const { employeeCode } = await insertEmployee({ lastName: "Lamarr" });
    expect(lastNames(await list({ q: employeeCode }))).toEqual(["Lamarr"]);
  });

  it("treats LIKE wildcards in the search term literally", async () => {
    expect((await list({ q: "%" })).data).toEqual([]);
    expect((await list({ q: "_" })).data).toEqual([]);
  });
});

describe("listEmployees filters", () => {
  beforeEach(async () => {
    await insertEmployee({
      lastName: "UkEng",
      countryCode: "GB",
      department: "Engineering",
    });
    await insertEmployee({
      lastName: "UkSales",
      countryCode: "GB",
      department: "Sales",
      jobTitle: "Account Executive",
    });
    await insertEmployee({
      lastName: "InEng",
      countryCode: "IN",
      department: "Engineering",
    });
    await insertEmployee({
      lastName: "Gone",
      countryCode: "GB",
      terminatedAt: new Date("2026-01-01"),
    });
  });

  it("filters by country", async () => {
    expect(lastNames(await list({ countryCode: "IN" }))).toEqual(["InEng"]);
  });

  it("combines country and department filters", async () => {
    const engineering = await departmentId("Engineering");
    expect(
      lastNames(await list({ countryCode: "GB", departmentId: String(engineering) })),
    ).toEqual(["UkEng"]);
  });

  it("filters by exact job title", async () => {
    expect(lastNames(await list({ jobTitle: "Account Executive" }))).toEqual(["UkSales"]);
  });

  it("hides terminated employees by default", async () => {
    expect(lastNames(await list())).not.toContain("Gone");
  });

  it("includes terminated employees when asked", async () => {
    expect(lastNames(await list({ includeTerminated: "true" }))).toContain("Gone");
  });
});

describe("listEmployees sorting and USD conversion", () => {
  beforeEach(async () => {
    // At FX 2026-10: GBP 1.27, JPY 0.0067, INR 0.012 USD per unit.
    await insertEmployee({
      lastName: "Pounds",
      countryCode: "GB",
      salaryMinor: 5_000_000,
    }); // £50,000 = $63,500
    await insertEmployee({
      lastName: "Dollars",
      countryCode: "US",
      salaryMinor: 6_000_000,
    }); // $60,000
    await insertEmployee({ lastName: "Yen", countryCode: "JP", salaryMinor: 10_000_000 }); // ¥10,000,000 = $67,000
    await insertEmployee({
      lastName: "Rupees",
      countryCode: "IN",
      salaryMinor: 300_000_000,
    }); // ₹3,000,000 = $36,000
  });

  it("converts each salary to USD cents at the active rate", async () => {
    const byName = Object.fromEntries(
      (await list()).data.map((e) => [e.lastName, e.salaryUsdCents]),
    );
    expect(byName).toEqual({
      Pounds: 6_350_000,
      Dollars: 6_000_000,
      Yen: 6_700_000,
      Rupees: 3_600_000,
    });
  });

  it("sorts by USD salary across currencies", async () => {
    expect(lastNames(await list({ sort: "salaryUsd", order: "desc" }))).toEqual([
      "Yen",
      "Pounds",
      "Dollars",
      "Rupees",
    ]);
  });

  it("sorts by name ascending by default", async () => {
    expect(lastNames(await list())).toEqual(["Dollars", "Pounds", "Rupees", "Yen"]);
  });

  it("breaks ties deterministically by id", async () => {
    await insertEmployee({ lastName: "Twin", hireDate: "2020-01-01" });
    await insertEmployee({ lastName: "Twin", hireDate: "2020-01-01" });
    const first = await list({ sort: "hireDate" });
    const second = await list({ sort: "hireDate" });
    expect(first.data.map((e) => e.id)).toEqual(second.data.map((e) => e.id));
  });
});

describe("GET /api/employees", () => {
  it("returns data and meta", async () => {
    await insertEmployee();

    const response = await GET(authed("http://localhost/api/employees?pageSize=10"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 10, total: 1 });
  });

  it("returns 400 for an invalid sort field", async () => {
    const response = await GET(authed("http://localhost/api/employees?sort=password"));

    expect(response.status).toBe(400);
    expect((await response.json()).error.details.fieldErrors).toHaveProperty("sort");
  });
});
