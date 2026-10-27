import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

/**
 * The signed-in user for server components. proxy.ts already guarantees a session on
 * app pages; this is for display (e.g. the user's name). Callers must sit inside
 * <Suspense> under Cache Components.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  // Token expiry checks read the clock; with Partial Prefetching, cookies can be
  // available during a runtime prerender, so defer explicitly to request time.
  await connection();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
