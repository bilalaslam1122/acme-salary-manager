import { describe, expect, it } from "vitest";
import type { GroupSalaryStats } from "@/lib/services/insights";
import {
  headcountRows,
  histogramRows,
  horizontalChartHeight,
  medianRows,
} from "./chart-data";

const group = (
  key: string,
  label: string,
  headcount: number,
  medianUsdCents: number | null,
): GroupSalaryStats => ({
  key,
  label,
  headcount,
  medianUsdCents,
  minUsdCents: medianUsdCents,
  maxUsdCents: medianUsdCents,
  avgUsdCents: medianUsdCents,
});

const groups = [
  group("US", "United States", 2_979, 10_570_050),
  group("SG", "Singapore", 727, 8_998_400),
  group("IN", "India", 2_011, 3_186_000),
];

describe("medianRows", () => {
  it("converts cents to whole dollars and keeps the API order", () => {
    expect(medianRows(groups).map((r) => [r.key, r.medianUsd])).toEqual([
      ["US", 105_701],
      ["SG", 89_984],
      ["IN", 31_860],
    ]);
  });

  it("drops groups without a median", () => {
    expect(medianRows([group("XX", "Empty", 0, null)])).toEqual([]);
  });
});

describe("headcountRows", () => {
  it("orders by headcount, largest first", () => {
    expect(headcountRows(groups).map((r) => r.key)).toEqual(["US", "IN", "SG"]);
  });
});

describe("histogramRows", () => {
  it("labels buckets by lower edge and range", () => {
    expect(
      histogramRows([{ fromUsdCents: 3_500_000, toUsdCents: 4_000_000, count: 12 }]),
    ).toEqual([{ label: "$35K", range: "$35K–$40K", count: 12 }]);
  });
});

describe("horizontalChartHeight", () => {
  it("includes the x-axis band", () => {
    expect(horizontalChartHeight(8)).toBe(8 * 32 + 32);
  });

  it("never collapses to zero rows", () => {
    expect(horizontalChartHeight(0)).toBe(32 + 32);
  });
});
