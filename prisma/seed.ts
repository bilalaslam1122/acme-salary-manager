import "dotenv/config";
import { createPrismaClient } from "../lib/db/create-client";
import { parseEnv, parseSeedAdminEnv } from "../lib/env";
import { upsertAdminUser } from "./seed/admin";
import { generateDataset } from "./seed/generate";
import { writeDataset } from "./seed/write";

async function main(): Promise<void> {
  // Validate everything up front so a missing variable fails before any data is wiped.
  const { DATABASE_URL } = parseEnv(process.env);
  const admin = parseSeedAdminEnv(process.env);
  const prisma = createPrismaClient(DATABASE_URL);
  const started = performance.now();
  try {
    const dataset = generateDataset();
    await writeDataset(prisma, dataset);
    const user = await upsertAdminUser(prisma, admin);
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
