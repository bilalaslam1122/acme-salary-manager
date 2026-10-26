import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

/**
 * Builds a Prisma client for a connection string. Kept free of `server-only` so the
 * seed script and integration tests (plain Node) can use it; app code imports the
 * singleton from `./client` instead.
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
