import { generateDataset } from "@/prisma/seed/generate";
import { writeDataset } from "@/prisma/seed/write";
import { testPrisma } from "./db";

/** Resets the test DB to reference data only: countries, departments, FX rates. */
export async function seedReferenceData(): Promise<void> {
  await writeDataset(testPrisma, generateDataset({ employeeCount: 0 }));
}

export async function departmentId(name: string): Promise<number> {
  const department = await testPrisma.department.findUniqueOrThrow({ where: { name } });
  return department.id;
}

let sequence = 0;

/** A valid create payload (pre-parse shape, as an API client would send it). */
export async function employeePayload(overrides: Record<string, unknown> = {}) {
  sequence += 1;
  return {
    firstName: "Ada",
    lastName: "Lovelace",
    email: `ada.${sequence}@acme.example`,
    jobTitle: "Software Engineer",
    departmentId: await departmentId("Engineering"),
    countryCode: "GB",
    salaryMinor: 8_000_000,
    hireDate: "2024-03-01",
    ...overrides,
  };
}
