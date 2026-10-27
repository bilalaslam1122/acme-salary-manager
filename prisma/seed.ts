import "dotenv/config";
import { createPrismaClient } from "../lib/db/create-client";
import { parseEnv, parseSeedAdminEnv } from "../lib/env";
import { upsertAdminUser, upsertDemoUser } from "./seed/admin";
import { generateDataset } from "./seed/generate";
import { countUserMadeChanges, writeDataset } from "./seed/write";

async function main(): Promise<void> {
  // Validate everything up front so a missing variable fails before any data is wiped.
  const { DATABASE_URL } = parseEnv(process.env);
  const admin = parseSeedAdminEnv(process.env);
  const prisma = createPrismaClient(DATABASE_URL);
  const started = performance.now();
  try {
    const userChanges = await countUserMadeChanges(prisma);
    if (userChanges > 0 && process.env.SEED_FORCE !== "true") {
      throw new Error(
        `Refusing to reset: the database holds ${userChanges} change(s) made by HR users, which the seed would delete. Re-run with SEED_FORCE=true to wipe it anyway.`,
      );
    }
    const dataset = generateDataset();
    await writeDataset(prisma, dataset);
    const user = await upsertAdminUser(prisma, admin);
    await upsertDemoUser(prisma);
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    const active = dataset.employees.filter((e) => e.terminatedAt === null).length;
    console.log(
      `Seeded ${active} active and ${dataset.employees.length - active} former employees, ${dataset.salaryHistory.length} salary history rows in ${seconds}s`,
    );
    console.log(`HR Manager login: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
