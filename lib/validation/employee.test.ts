import { describe, expect, it } from "vitest";
import {
  createEmployeeSchema,
  employeeIdSchema,
  MAX_SALARY_MINOR,
  updateEmployeeSchema,
} from "./employee";

const valid = {
  firstName: " Ada ",
  lastName: "Lovelace",
  email: "Ada.Lovelace@Acme.Example",
  jobTitle: "Software Engineer",
  departmentId: 1,
  countryCode: "gb",
  salaryMinor: 9_500_000,
  hireDate: "2024-03-01",
};

describe("createEmployeeSchema", () => {
  it("normalizes names, email and country code", () => {
    const parsed = createEmployeeSchema.parse(valid);
    expect(parsed.firstName).toBe("Ada");
    expect(parsed.email).toBe("ada.lovelace@acme.example");
    expect(parsed.countryCode).toBe("GB");
  });

  it("accepts an email with surrounding whitespace (trimmed before validation)", () => {
    const parsed = createEmployeeSchema.parse({ ...valid, email: "  ada@acme.example " });
    expect(parsed.email).toBe("ada@acme.example");
  });

  it("parses hireDate as a UTC midnight date", () => {
    const parsed = createEmployeeSchema.parse(valid);
    expect(parsed.hireDate.toISOString()).toBe("2024-03-01T00:00:00.000Z");
  });

  it("rejects fractional salaries", () => {
    const result = createEmployeeSchema.safeParse({ ...valid, salaryMinor: 100.5 });
    expect(result.success).toBe(false);
  });

  it("rejects salaries above the int4-safe maximum", () => {
    const result = createEmployeeSchema.safeParse({
      ...valid,
      salaryMinor: MAX_SALARY_MINOR + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid calendar date", () => {
    const result = createEmployeeSchema.safeParse({ ...valid, hireDate: "2024-02-30" });
    expect(result.success).toBe(false);
  });

  it("rejects a client-supplied salary currency", () => {
    const result = createEmployeeSchema.safeParse({ ...valid, salaryCurrency: "USD" });
    expect(result.success).toBe(false);
  });

  it("reports every missing required field", () => {
    const result = createEmployeeSchema.safeParse({});
    const paths = result.error?.issues.map((issue) => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(Object.keys(valid)));
  });
});

describe("updateEmployeeSchema", () => {
  it("accepts a single-field update", () => {
    expect(updateEmployeeSchema.parse({ jobTitle: "Staff Engineer" })).toEqual({
      jobTitle: "Staff Engineer",
    });
  });

  it("rejects an empty update", () => {
    expect(updateEmployeeSchema.safeParse({}).success).toBe(false);
  });

  it("requires salaryMinor when the country changes", () => {
    const result = updateEmployeeSchema.safeParse({ countryCode: "JP" });
    expect(result.error?.issues[0]?.path).toEqual(["salaryMinor"]);
  });
});

describe("employeeIdSchema", () => {
  it("coerces a numeric route param", () => {
    expect(employeeIdSchema.parse("42")).toBe(42);
  });

  it.each(["abc", "0", "-1", "1.5"])("rejects %s", (value) => {
    expect(employeeIdSchema.safeParse(value).success).toBe(false);
  });
});
