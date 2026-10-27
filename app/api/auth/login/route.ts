import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { handle, json, parseInput, readJson } from "@/lib/http/handle";
import { authenticate } from "@/lib/services/auth";
import { loginSchema } from "@/lib/validation/auth";

/** Public: exchanges credentials for a session cookie. */
export const POST = handle(async (request: Request) => {
  const session = await authenticate(parseInput(loginSchema, await readJson(request)));
  const response = json({
    user: { id: session.userId, email: session.email, name: session.name },
  });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(session),
    sessionCookieOptions(),
  );
  return response;
});
