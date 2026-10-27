import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps a same-origin path with its query", () => {
    expect(safeNextPath("/employees?page=2&countryCode=IN")).toBe(
      "/employees?page=2&countryCode=IN",
    );
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["absolute URL", "https://evil.example/phish"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["javascript URL", "javascript:alert(1)"],
    ["login loop", "/login?next=/employees"],
  ])("falls back to the default for a %s", (_label, value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_AFTER_LOGIN);
  });
});
