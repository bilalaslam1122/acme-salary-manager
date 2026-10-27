import { beforeEach, describe, expect, it } from "vitest";
import { GET as exportEmployees } from "@/app/api/employees/export/route";
import { GET as exportByGroup } from "@/app/api/insights/by-group/export/route";
import { authed, signIn } from "./auth";
import { insertEmployee, seedReferenceData } from "./factories";

beforeEach(async () => {
  await seedReferenceData();
  await signIn();
});

async function download(handler: (r: Request) => Promise<Response>, url: string) {
  const response = await handler(authed(url));
  const buffer = new Uint8Array(await response.arrayBuffer());
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(buffer);
  return { response, text, lines: text.replace(/^﻿/, "").trimEnd().split("\r\n") };
}

describe("GET /api/employees/export", () => {
  beforeEach(async () => {
    await insertEmployee({
      lastName: "Pounds",
      countryCode: "GB",
      salaryMinor: 5_000_050,
    });
    await insertEmployee({ lastName: "Yen", countryCode: "JP", salaryMinor: 10_000_000 });
    await insertEmployee({
      lastName: "Gone",
      countryCode: "GB",
      terminatedAt: new Date("2026-02-01T00:00:00.000Z"),
    });
  });

  it("downloads an uncached UTF-8 CSV that Excel opens correctly", async () => {
    const { response, text } = await download(
      exportEmployees,
      "http://localhost/api/employees/export",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="acme-employees-active-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(text.startsWith("﻿")).toBe(true);
  });

  it("exports exact local and USD amounts, not formatted text", async () => {
    const { lines } = await download(
      exportEmployees,
      "http://localhost/api/employees/export?sort=name",
    );

    expect(lines[0]).toBe(
      "Employee code,First name,Last name,Email,Job title,Department,Country,Currency,Annual salary,Annual salary USD (FX 2026-10),Hire date,Status,Terminated on",
    );
    // £50,000.50 × 1.27 = $63,500.64 (rounded to the cent); ¥10,000,000 × 0.0067 = $67,000.
    expect(lines.find((l) => l.includes("Pounds"))).toContain(",GBP,50000.50,63500.64,");
    expect(lines.find((l) => l.includes("Yen"))).toContain(",JPY,10000000,67000.00,");
  });

  it("follows the directory's status filter, across every page", async () => {
    const active = await download(
      exportEmployees,
      "http://localhost/api/employees/export?pageSize=1",
    );
    const terminated = await download(
      exportEmployees,
      "http://localhost/api/employees/export?status=terminated",
    );

    expect(active.lines).toHaveLength(1 + 2);
    expect(terminated.lines).toHaveLength(1 + 1);
    expect(terminated.lines[1]).toMatch(/,Gone,.*,Terminated,2026-02-01$/);
  });

  it("neutralises a name that a spreadsheet would run as a formula", async () => {
    await insertEmployee({ lastName: '=HYPERLINK("http://evil")' });

    const { lines } = await download(
      exportEmployees,
      "http://localhost/api/employees/export",
    );

    expect(lines.some((l) => l.includes('"\'=HYPERLINK(""http://evil"")"'))).toBe(true);
  });

  it("returns 400 for an invalid query instead of exporting the wrong view", async () => {
    const { response } = await download(
      exportEmployees,
      "http://localhost/api/employees/export?status=fired",
    );
    expect(response.status).toBe(400);
  });
});

describe("GET /api/insights/by-group/export", () => {
  it("exports the group table in USD for active employees only", async () => {
    await insertEmployee({ countryCode: "US", salaryMinor: 6_000_000 });
    await insertEmployee({ countryCode: "US", salaryMinor: 8_000_000 });
    await insertEmployee({ countryCode: "GB", salaryMinor: 5_000_000 });
    await insertEmployee({
      countryCode: "US",
      salaryMinor: 100_000_000,
      terminatedAt: new Date("2026-01-01"),
    });

    const { response, lines } = await download(
      exportByGroup,
      "http://localhost/api/insights/by-group/export?groupBy=country",
    );

    expect(response.headers.get("content-disposition")).toMatch(
      /filename="acme-salary-by-country-\d{4}-\d{2}-\d{2}\.csv"/,
    );
    expect(lines).toEqual([
      "Country,Headcount,Min salary USD (FX 2026-10),Median salary USD (FX 2026-10),Average salary USD (FX 2026-10),Max salary USD (FX 2026-10)",
      "United States,2,60000.00,70000.00,70000.00,80000.00",
      "United Kingdom,1,63500.00,63500.00,63500.00,63500.00",
    ]);
  });

  it("returns 400 without a grouping", async () => {
    const { response } = await download(
      exportByGroup,
      "http://localhost/api/insights/by-group/export",
    );
    expect(response.status).toBe(400);
  });
});
