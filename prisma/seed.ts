import "dotenv/config";
import { createPrismaClient } from "../lib/db/create-client";
import { parseEnv } from "../lib/env";
import { generateDataset } from "./seed/generate";
import { writeDataset } from "./seed/write";

async function main(): Promise<void> {
  const { DATABASE_URL } = parseEnv(process.env);
  const prisma = createPrismaClient(DATABASE_URL);
  const started = performance.now();
  try {
    const dataset = generateDataset();
    await writeDataset(prisma, dataset);
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(
      `Seeded ${dataset.employees.length} employees and ${dataset.salaryHistory.length} salary history rows in ${seconds}s`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
