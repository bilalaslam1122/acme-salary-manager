import { describe, expect, it } from "vitest";
import { minorToMajorInput, parseMajorToMinor } from "./parse";

describe("parseMajorToMinor", () => {
  it.each([
    ["85000", 2, 8_500_000],
    ["85,000", 2, 8_500_000],
    [" 85 000 ", 2, 8_500_000],
    ["85000.5", 2, 8_500_050],
    ["85000.05", 2, 8_500_005],
    ["0.1", 2, 10],
    ["10000000", 0, 10_000_000],
  ])("parses %s with exponent %i", (input, exponent, expected) => {
    expect(parseMajorToMinor(input, exponent)).toBe(expected);
  });

  it("avoids float drift (0.1 + 0.2 style errors)", () => {
    expect(parseMajorToMinor("1.15", 2)).toBe(115);
    expect(parseMajorToMinor("4.35", 2)).toBe(435);
  });

  it.each([
    ["", 2],
    ["abc", 2],
    ["-100", 2],
    ["1e5", 2],
    ["100.123", 2],
    ["100.5", 0],
    ["1.2.3", 2],
  ])("rejects %s with exponent %i", (input, exponent) => {
    expect(parseMajorToMinor(input, exponent)).toBeNull();
  });
});

describe("minorToMajorInput", () => {
  it.each([
    [8_500_000, 2, "85000"],
    [8_500_050, 2, "85000.5"],
    [5, 2, "0.05"],
    [10_000_000, 0, "10000000"],
  ])("formats %i with exponent %i as %s", (minor, exponent, expected) => {
    expect(minorToMajorInput(minor, exponent)).toBe(expected);
  });

  it("round-trips with parseMajorToMinor", () => {
    for (const minor of [1, 99, 100, 123_456, 8_500_050]) {
      expect(parseMajorToMinor(minorToMajorInput(minor, 2), 2)).toBe(minor);
    }
  });
});
