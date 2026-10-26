import { generateDataset } from "@/prisma/seed/generate";
import { COUNTRIES } from "@/prisma/seed/reference-data";
import { writeDataset } from "@/prisma/seed/write";
import { testPrisma } from "./db";

const currencyByCountry = new Map(COUNTRIES.map((c) => [c.code, c.currencyCode]));

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

export interface EmployeeFixture {
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  countryCode?: string;
  salaryMinor?: number;
  hireDate?: string;
  terminatedAt?: Date | null;
}

/**
 * Inserts an employee directly (bypassing the service) for read-side tests.
 * The currency is derived from the country, as Invariant 6 requires.
 */
export async function insertEmployee(fixture: EmployeeFixture = {}) {
  sequence += 1;
  const countryCode = fixture.countryCode ?? "GB";
  const employee = await testPrisma.employee.create({
    data: {
      employeeCode: `TEST-${String(sequence).padStart(5, "0")}`,
      firstName: fixture.firstName ?? "Ada",
      lastName: fixture.lastName ?? "Lovelace",
      email: fixture.email ?? `fixture.${sequence}@acme.example`,
      jobTitle: fixture.jobTitle ?? "Software Engineer",
      departmentId: await departmentId(fixture.department ?? "Engineering"),
      countryCode,
      salaryCurrency: currencyByCountry.get(countryCode)!,
      salaryMinor: fixture.salaryMinor ?? 8_000_000,
      hireDate: new Date(`${fixture.hireDate ?? "2024-03-01"}T00:00:00.000Z`),
      terminatedAt: fixture.terminatedAt ?? null,
    },
  });
  return employee;
}
