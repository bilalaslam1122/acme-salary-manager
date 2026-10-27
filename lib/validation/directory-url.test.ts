import { describe, expect, it } from "vitest";
import { directoryHref, parseDirectoryQuery, sortHref } from "./directory-url";

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
