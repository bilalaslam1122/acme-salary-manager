import { describe, expect, it } from "vitest";
import { formatMoney, formatUsdCents, formatUsdCompact } from "./format";

describe("formatMoney", () => {
  it("formats two-decimal currencies from minor units", () => {
    expect(formatMoney(8_000_000, "GBP", 2)).toBe("£80,000");
  });

  it("formats zero-decimal currencies (JPY) without dividing", () => {
    expect(formatMoney(9_000_000, "JPY", 0)).toBe("¥9,000,000");
  });

  it("uses narrow symbols for shared-symbol currencies", () => {
    expect(formatMoney(300_000_000, "INR", 2)).toBe("₹3,000,000");
    expect(formatMoney(5_000_000, "EUR", 2)).toBe("€50,000");
  });

  it("rounds to whole units for display", () => {
    expect(formatMoney(5_000_050, "USD", 2)).toBe("$50,001");
  });
});

describe("formatUsdCompact", () => {
  it.each([
    [0, "$0"],
    [3_500_000, "$35K"],
    [6_350_000, "$63.5K"],
    [125_000_000, "$1.3M"],
  ])("formats %i cents as %s", (cents, expected) => {
    expect(formatUsdCompact(cents)).toBe(expected);
  });
});

describe("formatUsdCents", () => {
  it("formats USD cents", () => {
    expect(formatUsdCents(6_350_000)).toBe("$63,500");
  });
});
