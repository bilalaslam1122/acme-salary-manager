import { jwtVerify, SignJWT } from "jose";
import { authEnv } from "@/lib/env";

// Stateless session (AD-9): an HS256 JWT in an HttpOnly cookie. No DB access here,
// so proxy.ts can verify sessions without touching Prisma.

export const SESSION_COOKIE = "acme_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface Session {
  userId: number;
  email: string;
  name: string;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(authEnv().SESSION_SECRET);
}

export async function createSessionToken(
  session: Session,
  now: Date = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.userId))
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_TTL_SECONDS)
    .sign(secretKey());
}

/** The session in a token, or null if it is missing, tampered with or expired. */
export async function verifySessionToken(
  token: string | undefined,
  now: Date = new Date(),
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      currentDate: now,
    });
    const userId = Number(payload.sub);
    if (
      !Number.isInteger(userId) ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return { userId, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: authEnv().NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
