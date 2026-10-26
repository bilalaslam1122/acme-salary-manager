import { describe, expect, it } from "vitest";
import { employeeListQuerySchema, MAX_PAGE_SIZE } from "./employee-list";

describe("employeeListQuerySchema", () => {
  it("applies defaults for an empty query string", () => {
    expect(employeeListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 50,
      includeTerminated: false,
      sort: "name",
      order: "asc",
    });
  });

  it("coerces numeric and boolean query params", () => {
    const parsed = employeeListQuerySchema.parse({
      page: "3",
      pageSize: "25",
      departmentId: "4",
      includeTerminated: "true",
    });
    expect(parsed).toMatchObject({
      page: 3,
      pageSize: 25,
      departmentId: 4,
      includeTerminated: true,
    });
  });

  it("caps the page size", () => {
    const result = employeeListQuerySchema.safeParse({
      pageSize: String(MAX_PAGE_SIZE + 1),
    });
    expect(result.success).toBe(false);
  });

  it("drops a blank search term", () => {
    expect(employeeListQuerySchema.parse({ q: "   " }).q).toBeUndefined();
  });

  it("uppercases the country filter", () => {
    expect(employeeListQuerySchema.parse({ countryCode: "in" }).countryCode).toBe("IN");
  });

  it.each([
    ["sort", "salary_minor; DROP TABLE employees"],
    ["order", "sideways"],
    ["page", "0"],
  ])("rejects an invalid %s", (key, value) => {
    expect(employeeListQuerySchema.safeParse({ [key]: value }).success).toBe(false);
  });
});
