import { describe, expect, it } from "vitest";
import { parseAuthEnv, parseEnv, parseSeedAdminEnv } from "./env";

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

describe("parseAuthEnv", () => {
  it("rejects a SESSION_SECRET shorter than 32 characters", () => {
    expect(() => parseAuthEnv({ SESSION_SECRET: "too-short" })).toThrow(/SESSION_SECRET/);
  });

  it("does not require DATABASE_URL", () => {
    expect(parseAuthEnv({ SESSION_SECRET: "x".repeat(32) }).SESSION_SECRET).toHaveLength(
      32,
    );
  });
});

describe("parseSeedAdminEnv", () => {
  it("normalizes the email and defaults the name", () => {
    expect(
      parseSeedAdminEnv({
        SEED_ADMIN_EMAIL: " HR@Acme.Example ",
        SEED_ADMIN_PASSWORD: "long-enough-password",
      }),
    ).toEqual({
      SEED_ADMIN_EMAIL: "hr@acme.example",
      SEED_ADMIN_PASSWORD: "long-enough-password",
      SEED_ADMIN_NAME: "HR Manager",
    });
  });

  it("rejects a password shorter than 12 characters", () => {
    expect(() =>
      parseSeedAdminEnv({
        SEED_ADMIN_EMAIL: "hr@acme.example",
        SEED_ADMIN_PASSWORD: "short",
      }),
    ).toThrow(/SEED_ADMIN_PASSWORD/);
  });
});
