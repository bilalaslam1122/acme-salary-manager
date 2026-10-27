import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { handle, json } from "@/lib/http/handle";
import { demoSession } from "@/lib/services/auth";
import { demoLoginEnabled } from "@/lib/auth/demo";

/**
 * Public, and only when DEMO_LOGIN=true: signs in as the demo HR account without a
 * password, so reviewers of the live demo need no credentials. 404 otherwise, so a
 * normal deployment does not reveal that the route exists.
 */
export const POST = handle(async () => {
  if (!demoLoginEnabled()) throw new NotFoundError("Not found");
  const session = await demoSession();
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
