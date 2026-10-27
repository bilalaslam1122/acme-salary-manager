import { describe, expect, it } from "vitest";
import {
  directoryHref,
  hasDirectoryFilters,
  parseDirectoryQuery,
  sortHref,
  statusHref,
} from "./directory-url";

describe("parseDirectoryQuery", () => {
  it("parses page searchParams like the API does", () => {
    expect(
      parseDirectoryQuery({ page: "3", countryCode: "in", q: " ada " }),
    ).toMatchObject({
      page: 3,
      countryCode: "IN",
      q: "ada",
    });
  });

  it("takes the first value of a repeated param", () => {
    expect(parseDirectoryQuery({ page: ["2", "9"] }).page).toBe(2);
  });

  it("falls back to defaults for an invalid URL instead of throwing", () => {
    expect(parseDirectoryQuery({ pageSize: "5000", sort: "evil" })).toEqual(
      parseDirectoryQuery({}),
    );
  });
});

describe("directoryHref", () => {
  const base = parseDirectoryQuery({});

  it("omits defaults so URLs stay short", () => {
    expect(directoryHref(base)).toBe("/employees");
  });

  it("encodes overrides", () => {
    expect(directoryHref(base, { countryCode: "GB", page: 2 })).toBe(
      "/employees?page=2&countryCode=GB",
    );
  });

  it("produces the same URL regardless of the order filters were applied", () => {
    const byCountryFirst = directoryHref(parseDirectoryQuery({ countryCode: "GB" }), {
      departmentId: 3,
    });
    const byDepartmentFirst = directoryHref(parseDirectoryQuery({ departmentId: "3" }), {
      countryCode: "GB",
    });
    expect(byCountryFirst).toBe(byDepartmentFirst);
  });

  it("drops a cleared filter", () => {
    const filtered = parseDirectoryQuery({ countryCode: "GB" });
    expect(directoryHref(filtered, { countryCode: undefined })).toBe("/employees");
  });
});

describe("statusHref", () => {
  it("lists terminated employees most recent leaver first", () => {
    const query = parseDirectoryQuery({ page: "3", countryCode: "GB" });
    expect(statusHref(query, "terminated")).toBe(
      "/employees?countryCode=GB&status=terminated&sort=terminatedAt&order=desc",
    );
  });

  it("drops the 'left on' sort when going back to active employees", () => {
    const query = parseDirectoryQuery({ status: "terminated", sort: "terminatedAt" });
    expect(statusHref(query, "active")).toBe("/employees");
  });

  it("keeps the 'left on' sort for the all view, where it is still meaningful", () => {
    const query = parseDirectoryQuery({
      status: "terminated",
      sort: "terminatedAt",
      order: "desc",
    });
    expect(statusHref(query, "all")).toBe(
      "/employees?status=all&sort=terminatedAt&order=desc",
    );
  });

  it("keeps an unrelated sort", () => {
    const query = parseDirectoryQuery({ sort: "salaryUsd", order: "desc" });
    expect(statusHref(query, "all")).toBe(
      "/employees?status=all&sort=salaryUsd&order=desc",
    );
  });
});

describe("hasDirectoryFilters", () => {
  it("treats a non-default status as a filter", () => {
    expect(hasDirectoryFilters(parseDirectoryQuery({}))).toBe(false);
    expect(hasDirectoryFilters(parseDirectoryQuery({ status: "terminated" }))).toBe(true);
  });
});

describe("sortHref", () => {
  it("starts a new column ascending and resets the page", () => {
    const query = parseDirectoryQuery({ page: "4" });
    expect(sortHref(query, "hireDate")).toBe("/employees?sort=hireDate");
  });

  it("flips the direction of the current column", () => {
    const query = parseDirectoryQuery({ sort: "salaryUsd" });
    expect(sortHref(query, "salaryUsd")).toBe("/employees?sort=salaryUsd&order=desc");
  });

  it("flips back to ascending", () => {
    const query = parseDirectoryQuery({ sort: "salaryUsd", order: "desc" });
    expect(sortHref(query, "salaryUsd")).toBe("/employees?sort=salaryUsd");
  });
});
