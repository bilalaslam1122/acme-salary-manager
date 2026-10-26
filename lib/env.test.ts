import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const validUrl = "postgresql://dev@localhost:5432/acme_salary";

describe("parseEnv", () => {
  it("accepts a postgres DATABASE_URL", () => {
    const env = parseEnv({ DATABASE_URL: validUrl, NODE_ENV: "test" });
    expect(env.DATABASE_URL).toBe(validUrl);
  });

  it("defaults NODE_ENV to development", () => {
    expect(parseEnv({ DATABASE_URL: validUrl }).NODE_ENV).toBe("development");
  });

  it("rejects a missing DATABASE_URL with the variable name in the message", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-postgres DATABASE_URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "file:./dev.db" })).toThrow(/DATABASE_URL/);
  });
});
