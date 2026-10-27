import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { testPrisma } from "./db";

let cookie: string | undefined;
let sequence = 0;

/**
 * Creates an HR user and a signed session for them. Call after the DB is reset (the
 * reset truncates users); later `authed()` requests carry this session.
 */
export async function signIn(): Promise<{ userId: number; cookie: string }> {
  sequence += 1;
  const user = await testPrisma.user.create({
    data: {
      email: `hr.${sequence}@acme.example`,
      name: "Test HR",
      passwordHash: "unused",
    },
  });
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  cookie = `${SESSION_COOKIE}=${token}`;
  return { userId: user.id, cookie };
}

/** A Request carrying the current test session cookie. */
export function authed(url: string, init: RequestInit = {}): Request {
  if (!cookie) throw new Error("Call signIn() before authed()");
  const headers = new Headers(init.headers);
  headers.set("cookie", cookie);
  return new Request(url, { ...init, headers });
}
