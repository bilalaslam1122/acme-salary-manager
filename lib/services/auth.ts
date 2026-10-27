import "server-only";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { Session } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { UnauthorizedError } from "@/lib/errors";
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
