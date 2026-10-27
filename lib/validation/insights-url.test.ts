import { describe, expect, it } from "vitest";
import { filtersOf, hasFilters, insightsHref, parseInsightsQuery } from "./insights-url";

describe("parseInsightsQuery", () => {
  it("defaults to grouping by country with no filters", () => {
    expect(parseInsightsQuery({})).toEqual({ groupBy: "country" });
  });

  it("parses the group and filters", () => {
    expect(
      parseInsightsQuery({ groupBy: "jobTitle", countryCode: "in", departmentId: "2" }),
    ).toEqual({ groupBy: "jobTitle", countryCode: "IN", departmentId: 2 });
  });

  it("falls back to defaults for an invalid group", () => {
    expect(parseInsightsQuery({ groupBy: "salary" })).toEqual({ groupBy: "country" });
  });
});

describe("insightsHref", () => {
  it("omits defaults", () => {
    expect(insightsHref(parseInsightsQuery({}))).toBe("/insights");
  });

  it("keeps filters when switching tabs", () => {
    const query = parseInsightsQuery({ countryCode: "IN" });
    expect(insightsHref(query, { groupBy: "department" })).toBe(
      "/insights?groupBy=department&countryCode=IN",
    );
  });

  it("is canonical regardless of the order filters were applied", () => {
    const a = insightsHref(parseInsightsQuery({ countryCode: "GB" }), { jobTitle: "QA" });
    const b = insightsHref(parseInsightsQuery({ jobTitle: "QA" }), { countryCode: "GB" });
    expect(a).toBe(b);
  });
});

describe("filtersOf / hasFilters", () => {
  it("extracts only the shared filters", () => {
    const query = parseInsightsQuery({ groupBy: "department", countryCode: "JP" });
    expect(filtersOf(query)).toEqual({
      countryCode: "JP",
      departmentId: undefined,
      jobTitle: undefined,
    });
    expect(hasFilters(query)).toBe(true);
    expect(hasFilters(parseInsightsQuery({ groupBy: "department" }))).toBe(false);
  });
});
