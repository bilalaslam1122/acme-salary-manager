import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";
import { PrismaClient } from "./generated/prisma/client";

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env().DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (env().NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
