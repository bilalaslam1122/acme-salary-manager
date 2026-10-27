import { describe, expect, it } from "vitest";
import { demoLoginEnabled } from "./demo";

describe("demoLoginEnabled", () => {
  it("is off unless DEMO_LOGIN is exactly 'true'", () => {
    expect(demoLoginEnabled({})).toBe(false);
    expect(demoLoginEnabled({ DEMO_LOGIN: "false" })).toBe(false);
    expect(demoLoginEnabled({ DEMO_LOGIN: "1" })).toBe(false);
    expect(demoLoginEnabled({ DEMO_LOGIN: "true" })).toBe(true);
  });
});
