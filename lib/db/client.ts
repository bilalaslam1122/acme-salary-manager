import "server-only";
import { env } from "@/lib/env";
import { createPrismaClient } from "./create-client";
import type { PrismaClient } from "./generated/prisma/client";

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient(env().DATABASE_URL);

if (env().NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
