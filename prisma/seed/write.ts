import type { PrismaClient } from "../../lib/db/generated/prisma/client";
import type { Dataset } from "./generate";

const BATCH_SIZE = 1_000;

// Tables with explicit seeded ids whose serial sequences must be advanced afterwards.
const SERIAL_TABLES = [
  "departments",
  "exchange_rates",
  "employees",
  "salary_history",
  "employee_events",
];

const TRUNCATE_ALL =
  "TRUNCATE employee_events, salary_history, employees, exchange_rates, departments, countries, users RESTART IDENTITY CASCADE";

type Executor = Pick<PrismaClient, "$executeRawUnsafe">;

/** Deletes all rows from every table and resets id sequences. */
export async function truncateAll(db: Executor): Promise<void> {
  await db.$executeRawUnsafe(TRUNCATE_ALL);
}

/**
 * Replaces all data with the dataset in one transaction. Destructive by design: the
 * seed always produces the same database state.
 */
export async function writeDataset(
  prisma: PrismaClient,
  dataset: Dataset,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await truncateAll(tx);

      await tx.country.createMany({ data: dataset.countries });
      await tx.department.createMany({ data: dataset.departments });
      await tx.exchangeRate.createMany({ data: dataset.exchangeRates });
      for (const batch of chunk(dataset.employees, BATCH_SIZE)) {
        await tx.employee.createMany({ data: batch });
      }
      for (const batch of chunk(dataset.salaryHistory, BATCH_SIZE)) {
        await tx.salaryHistory.createMany({ data: batch });
      }
      for (const batch of chunk(dataset.employeeEvents, BATCH_SIZE)) {
        await tx.employeeEvent.createMany({ data: batch });
      }

      for (const table of SERIAL_TABLES) {
        // Table names come from the constant above, never from input.
        await tx.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
        );
      }
    },
    { timeout: 120_000 },
  );
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
