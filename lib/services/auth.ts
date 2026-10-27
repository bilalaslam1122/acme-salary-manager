import "server-only";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Session } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { DEMO_USER } from "@/lib/auth/demo";
import { NotFoundError, UnauthorizedError } from "@/lib/errors";
import type { LoginInput } from "@/lib/validation/auth";

let dummyHash: Promise<string> | undefined;

/**
 * Checks credentials and returns the session identity. Unknown emails still run a
 * bcrypt comparison so response time does not reveal which emails exist.
 */
export async function authenticate({ email, password }: LoginInput): Promise<Session> {
  const user = await prisma.user.findUnique({ where: { email } });
  dummyHash ??= hashPassword("timing-equalizer-not-a-real-password");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

  if (!user || !valid) {
    throw new UnauthorizedError("Invalid email or password");
  }
  return { userId: user.id, email: user.email, name: user.name };
}

/** The demo account's session identity. The caller checks that demo login is enabled. */
export async function demoSession(): Promise<Session> {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER.email } });
  if (!user) throw new NotFoundError("The demo account has not been seeded");
  return { userId: user.id, email: user.email, name: user.name };
}
