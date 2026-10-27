import { UnauthorizedError } from "@/lib/errors";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

/**
 * Verifies the session cookie on an incoming API request (Invariant 9). proxy.ts
 * checks first; this is the second line of defence that route handlers rely on, as
 * the Next.js docs recommend. Reads the Cookie header directly so handlers stay
 * testable without a Next request scope.
 */
export async function requireSession(request: Request): Promise<Session> {
  const session = await verifySessionToken(readCookie(request, SESSION_COOKIE));
  if (!session) throw new UnauthorizedError("Sign in to continue");
  return session;
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}
