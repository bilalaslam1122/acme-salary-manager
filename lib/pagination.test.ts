import { describe, expect, it } from "vitest";
import { pageItems, pageRange } from "./pagination";

describe("pageItems", () => {
  it("lists every page when they all fit", () => {
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses both sides around a page in the middle", () => {
    expect(pageItems(7, 200)).toEqual([
      1,
      "ellipsis-start",
      6,
      7,
      8,
      "ellipsis-end",
      200,
    ]);
  });

  it("shows the opening pages near the start", () => {
    expect(pageItems(1, 200)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 200]);
    expect(pageItems(4, 200)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 200]);
  });

  it("shows the closing pages near the end", () => {
    expect(pageItems(200, 200)).toEqual([1, "ellipsis-start", 196, 197, 198, 199, 200]);
    expect(pageItems(197, 200)).toEqual([1, "ellipsis-start", 196, 197, 198, 199, 200]);
  });

  it("never uses an ellipsis to hide a single page", () => {
    expect(pageItems(5, 8)).toEqual([1, "ellipsis-start", 4, 5, 6, 7, 8]);
    expect(pageItems(4, 8)).toEqual([1, 2, 3, 4, 5, "ellipsis-end", 8]);
  });

  it("keeps a constant width while paging so the control doesn't jump", () => {
    const widths = new Set(
      Array.from({ length: 200 }, (_, index) => pageItems(index + 1, 200).length),
    );
    expect(widths).toEqual(new Set([7]));
  });

  it("always includes the current, first and last page", () => {
    for (let page = 1; page <= 50; page++) {
      const items = pageItems(page, 50);
      expect(items).toContain(page);
      expect(items[0]).toBe(1);
      expect(items.at(-1)).toBe(50);
    }
  });

  it("clamps an out-of-range page and handles no pages", () => {
    expect(pageItems(999, 200)).toEqual(pageItems(200, 200));
    expect(pageItems(1, 0)).toEqual([]);
  });

  it("supports more siblings", () => {
    expect(pageItems(50, 100, 2)).toEqual([
      1,
      "ellipsis-start",
      48,
      49,
      50,
      51,
      52,
      "ellipsis-end",
      100,
    ]);
  });
});

describe("pageRange", () => {
  it("computes the visible item range", () => {
    expect(pageRange(7, 50, 10_000)).toEqual({ first: 301, last: 350, inRange: true });
  });

  it("caps the last item at the total", () => {
    expect(pageRange(3, 50, 120)).toEqual({ first: 101, last: 120, inRange: true });
  });

  it("flags a page past the end", () => {
    expect(pageRange(9, 50, 120).inRange).toBe(false);
  });
});
