import { describe, expect, it } from "vitest";
import { HISTOGRAM_BUCKETS, histogramLayout } from "./histogram";

const usd = (dollars: number) => dollars * 100;

describe("histogramLayout", () => {
  it("rounds the start down and the width up to $5k", () => {
    // Range $36k–$80k: $44k / 20 = $2.2k, which rounds up to $5k.
    expect(histogramLayout(usd(36_000), usd(80_000))).toEqual({
      startCents: usd(35_000),
      widthCents: usd(5_000),
      bucketCount: 10,
    });
  });

  it("uses 20 buckets for a wide range", () => {
    const layout = histogramLayout(usd(20_000), usd(320_000));
    expect(layout.widthCents).toBe(usd(15_000));
    expect(layout.bucketCount).toBe(HISTOGRAM_BUCKETS);
  });

  it("caps at 20 buckets when rounding the start down would add a 21st", () => {
    // Start rounds down to $0 and width is $5k, so the max of $104,999 sits in an
    // unclamped bucket index of 20; it is folded into the last bucket.
    const layout = histogramLayout(usd(4_999), usd(104_999));
    expect(layout).toEqual({
      startCents: 0,
      widthCents: usd(5_000),
      bucketCount: HISTOGRAM_BUCKETS,
    });
  });

  it("uses a single bucket when every salary is equal", () => {
    expect(histogramLayout(usd(50_000), usd(50_000))).toEqual({
      startCents: usd(50_000),
      widthCents: usd(5_000),
      bucketCount: 1,
    });
  });
});
