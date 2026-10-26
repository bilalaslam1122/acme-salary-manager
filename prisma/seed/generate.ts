import { en, Faker } from "@faker-js/faker";
import type { Prisma } from "../../lib/db/generated/prisma/client";
import {
  COUNTRIES,
  DEPARTMENTS,
  EARLIEST_HIRE_DATE,
  FX_EFFECTIVE_DATE,
  FX_VERSION,
  JOB_TITLES,
  REFERENCE_DATE,
  USD_PER_UNIT_MICROS,
  type CountrySeed,
} from "./reference-data";

export const DEFAULT_SEED = 42;
export const DEFAULT_EMPLOYEE_COUNT = 10_000;

const MAX_PAST_RAISES = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Dataset {
  countries: Prisma.CountryCreateManyInput[];
  departments: Prisma.DepartmentCreateManyInput[];
  exchangeRates: Prisma.ExchangeRateCreateManyInput[];
  employees: Prisma.EmployeeCreateManyInput[];
  salaryHistory: Prisma.SalaryHistoryCreateManyInput[];
}

export interface GenerateOptions {
  seed?: number;
  employeeCount?: number;
}

/**
 * Builds the full seed dataset in memory. Pure and deterministic: the same options
 * always produce identical rows (fixed PRNG seed, fixed reference date, explicit ids).
 */
export function generateDataset(options: GenerateOptions = {}): Dataset {
  const seed = options.seed ?? DEFAULT_SEED;
  const employeeCount = options.employeeCount ?? DEFAULT_EMPLOYEE_COUNT;

  const faker = new Faker({ locale: [en] });
  faker.seed(seed);

  const departments = DEPARTMENTS.map((name, index) => ({ id: index + 1, name }));
  const departmentIdByName = new Map(departments.map((d) => [d.name, d.id]));

  const countryChoices = COUNTRIES.map((country) => ({
    weight: country.weight,
    value: country,
  }));
  const titleChoices = JOB_TITLES.map((title) => ({
    weight: title.weight,
    value: title,
  }));

  const employees: Prisma.EmployeeCreateManyInput[] = [];
  const salaryHistory: Prisma.SalaryHistoryCreateManyInput[] = [];

  for (let id = 1; id <= employeeCount; id++) {
    const country = faker.helpers.weightedArrayElement(countryChoices);
    const job = faker.helpers.weightedArrayElement(titleChoices);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const hireDate = toUtcDate(
      faker.date.between({ from: EARLIEST_HIRE_DATE, to: REFERENCE_DATE }),
    );

    const usd = job.baseUsd * country.payMultiplier * logNormalJitter(faker);
    const salaryMinor = usdToRoundedMinor(usd, country);

    employees.push({
      id,
      employeeCode: `ACME-${String(id).padStart(5, "0")}`,
      firstName,
      lastName,
      email: `${slug(firstName)}.${slug(lastName)}.${id}@acme.example`,
      jobTitle: job.title,
      departmentId: departmentIdByName.get(job.department)!,
      countryCode: country.code,
      salaryMinor,
      salaryCurrency: country.currencyCode,
      hireDate,
      terminatedAt: null,
      createdAt: REFERENCE_DATE,
      updatedAt: REFERENCE_DATE,
    });

    for (const change of salaryChanges(faker, salaryMinor, hireDate, country)) {
      salaryHistory.push({
        id: salaryHistory.length + 1,
        employeeId: id,
        currency: country.currencyCode,
        // Seeded employees never move country, so raises keep the same currency.
        oldCurrency: change.oldSalaryMinor === null ? null : country.currencyCode,
        changedById: null,
        ...change,
      });
    }
  }

  return {
    countries: COUNTRIES.map(({ code, name, currencyCode, currencyExponent }) => ({
      code,
      name,
      currencyCode,
      currencyExponent,
    })),
    departments,
    exchangeRates: Object.entries(USD_PER_UNIT_MICROS).map(
      ([currencyCode, usdPerUnitMicros], index) => ({
        id: index + 1,
        version: FX_VERSION,
        effectiveDate: FX_EFFECTIVE_DATE,
        currencyCode,
        usdPerUnitMicros,
      }),
    ),
    employees,
    salaryHistory,
  };
}

interface SalaryChange {
  oldSalaryMinor: number | null;
  newSalaryMinor: number;
  reason: string;
  changedAt: Date;
}

/**
 * The initial salary at hire, then 0–3 annual-ish raises ending exactly at the
 * current salary, so every employee's history chain is consistent.
 */
function salaryChanges(
  faker: Faker,
  currentMinor: number,
  hireDate: Date,
  country: CountrySeed,
): SalaryChange[] {
  const yearsEmployed = Math.floor(
    (REFERENCE_DATE.getTime() - hireDate.getTime()) / (365 * DAY_MS),
  );
  const raiseCount = faker.number.int({
    min: 0,
    max: Math.min(MAX_PAST_RAISES, yearsEmployed),
  });
  const raisePercents = Array.from({ length: raiseCount }, () =>
    faker.number.float({ min: 0.03, max: 0.12, fractionDigits: 3 }),
  );

  const growth = raisePercents.reduce((total, pct) => total * (1 + pct), 1);
  const roundUnit = country.roundTo * 10 ** country.currencyExponent;
  let salary = Math.max(roundUnit, roundToUnit(currentMinor / growth, roundUnit));

  const changes: SalaryChange[] = [
    {
      oldSalaryMinor: null,
      newSalaryMinor: salary,
      reason: "Initial salary",
      changedAt: hireDate,
    },
  ];

  const spanMs = REFERENCE_DATE.getTime() - hireDate.getTime();
  raisePercents.forEach((pct, index) => {
    const isLast = index === raisePercents.length - 1;
    const next = isLast ? currentMinor : roundToUnit(salary * (1 + pct), roundUnit);
    const changedAt = toUtcDate(
      new Date(hireDate.getTime() + (spanMs * (index + 1)) / (raiseCount + 1)),
    );
    changes.push({
      oldSalaryMinor: salary,
      newSalaryMinor: next,
      reason: "Annual review",
      changedAt,
    });
    salary = next;
  });

  return changes;
}

/** Log-normal multiplier around 1 (σ = 0.15), clamped to avoid extreme outliers. */
function logNormalJitter(faker: Faker): number {
  const u1 = faker.number.float({ min: Number.EPSILON, max: 1 });
  const u2 = faker.number.float({ min: 0, max: 1 });
  const standardNormal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(1.6, Math.max(0.6, Math.exp(0.15 * standardNormal)));
}

function usdToRoundedMinor(usd: number, country: CountrySeed): number {
  const rate = USD_PER_UNIT_MICROS[country.currencyCode];
  if (rate === undefined) {
    throw new Error(`Missing FX rate for ${country.currencyCode}`);
  }
  const major = (usd * 1_000_000) / rate;
  const roundedMajor = Math.max(country.roundTo, roundToUnit(major, country.roundTo));
  return roundedMajor * 10 ** country.currencyExponent;
}

function roundToUnit(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

function toUtcDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}
