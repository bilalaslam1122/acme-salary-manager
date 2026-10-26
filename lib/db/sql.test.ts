import { describe, expect, it } from "vitest";
import { escapeLike } from "./sql";

describe("escapeLike", () => {
  it("escapes percent and underscore wildcards", () => {
    expect(escapeLike("50%_off")).toBe("50\\%\\_off");
  });

  it("escapes the escape character itself", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("leaves ordinary text unchanged", () => {
    expect(escapeLike("O'Brien")).toBe("O'Brien");
  });
});
