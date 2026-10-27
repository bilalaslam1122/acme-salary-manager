import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
  sessionCookieOptions,
  verifySessionToken,
} from "./session";

const session = { userId: 7, email: "hr@acme.example", name: "HR Manager" };
const issued = new Date("2026-10-27T09:00:00.000Z");
const afterSeconds = (seconds: number) => new Date(issued.getTime() + seconds * 1000);

describe("session tokens", () => {
  it("round-trips the session identity", async () => {
    const token = await createSessionToken(session, issued);
    expect(await verifySessionToken(token, afterSeconds(60))).toEqual(session);
  });

  it("rejects a token after 8 hours", async () => {
    const token = await createSessionToken(session, issued);
    expect(
      await verifySessionToken(token, afterSeconds(SESSION_TTL_SECONDS + 1)),
    ).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken(session, issued);
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: "1", email: "evil@acme.example", name: "Evil" }),
    ).toString("base64url");
    expect(
      await verifySessionToken(`${header}.${forgedPayload}.${signature}`),
    ).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await new SignJWT({ email: session.email, name: session.name })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("7")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("another-secret-that-is-long-enough-to-sign"));
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("rejects a missing or malformed token", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});

describe("sessionCookieOptions", () => {
  it("is HttpOnly, SameSite=Lax and expires with the token", () => {
    expect(sessionCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
  });
});
