import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { handle, noContent } from "@/lib/http/handle";

/** Clears the session cookie. Idempotent, so it works with an expired session too. */
export const POST = handle(async () => {
  const response = noContent();
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
});
