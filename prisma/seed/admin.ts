import { randomBytes } from "node:crypto";
import { DEMO_USER } from "../../lib/auth/demo";
import { hashPassword } from "../../lib/auth/password";
import type { SeedAdminEnv } from "../../lib/env";
import type { PrismaClient } from "../../lib/db/generated/prisma/client";

/**
 * Creates or updates the single HR Manager login from SEED_ADMIN_* env vars.
 * Kept out of generateDataset: bcrypt salts make the hash differ on every run, so
 * the users row is the one exception to the seed's byte-identical guarantee.
 */
export async function upsertAdminUser(
  prisma: PrismaClient,
  admin: SeedAdminEnv,
): Promise<{ id: number; email: string }> {
  const passwordHash = await hashPassword(admin.SEED_ADMIN_PASSWORD);
  return prisma.user.upsert({
    where: { email: admin.SEED_ADMIN_EMAIL },
    create: { email: admin.SEED_ADMIN_EMAIL, name: admin.SEED_ADMIN_NAME, passwordHash },
    update: { name: admin.SEED_ADMIN_NAME, passwordHash },
    select: { id: true, email: true },
  });
}

/**
 * Creates the demo HR account behind the one-click demo sign-in. Its password is
 * random and discarded, so it can never be used through the normal login form.
 */
export async function upsertDemoUser(
  prisma: PrismaClient,
): Promise<{ id: number; email: string }> {
  const passwordHash = await hashPassword(randomBytes(32).toString("base64"));
  return prisma.user.upsert({
    where: { email: DEMO_USER.email },
    create: { ...DEMO_USER, passwordHash },
    update: { name: DEMO_USER.name, passwordHash },
    select: { id: true, email: true },
  });
}
