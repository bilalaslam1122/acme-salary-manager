import { createPrismaClient } from "@/lib/db/create-client";
import { truncateAll } from "@/prisma/seed/write";

// DATABASE_URL points at TEST_DATABASE_URL inside the integration project (vitest.config.mts).
export const testPrisma = createPrismaClient(process.env.DATABASE_URL!);

export async function resetDatabase(): Promise<void> {
  await truncateAll(testPrisma);
}
