// Static reference data for the seed. FX rates are illustrative, not market data.

export const REFERENCE_DATE = new Date("2026-10-01T00:00:00.000Z");
export const EARLIEST_HIRE_DATE = new Date("2012-01-01T00:00:00.000Z");

export const FX_VERSION = "2026-10";
export const FX_EFFECTIVE_DATE = REFERENCE_DATE;

export interface CountrySeed {
  code: string;
  name: string;
  currencyCode: string;
  currencyExponent: number;
  /** Share of total headcount. */
  weight: number;
  /** Pay level relative to the US for the same title. */
  payMultiplier: number;
  /** Salaries are rounded to a multiple of this many major units. */
  roundTo: number;
}

export const COUNTRIES: readonly CountrySeed[] = [
  {
    code: "US",
    name: "United States",
    currencyCode: "USD",
    currencyExponent: 2,
    weight: 30,
    payMultiplier: 1.0,
    roundTo: 100,
  },
  {
    code: "IN",
    name: "India",
    currencyCode: "INR",
    currencyExponent: 2,
    weight: 20,
    payMultiplier: 0.3,
    roundTo: 1000,
  },
  {
    code: "GB",
    name: "United Kingdom",
    currencyCode: "GBP",
    currencyExponent: 2,
    weight: 12,
    payMultiplier: 0.75,
    roundTo: 100,
  },
  {
    code: "DE",
    name: "Germany",
    currencyCode: "EUR",
    currencyExponent: 2,
    weight: 10,
    payMultiplier: 0.8,
    roundTo: 100,
  },
  {
    code: "CA",
    name: "Canada",
    currencyCode: "CAD",
    currencyExponent: 2,
    weight: 8,
    payMultiplier: 0.8,
    roundTo: 100,
  },
  {
    code: "FR",
    name: "France",
    currencyCode: "EUR",
    currencyExponent: 2,
    weight: 7,
    payMultiplier: 0.7,
    roundTo: 100,
  },
  {
    code: "SG",
    name: "Singapore",
    currencyCode: "SGD",
    currencyExponent: 2,
    weight: 7,
    payMultiplier: 0.85,
    roundTo: 100,
  },
  {
    code: "JP",
    name: "Japan",
    currencyCode: "JPY",
    currencyExponent: 0,
    weight: 6,
    payMultiplier: 0.7,
    roundTo: 10000,
  },
];

/** USD per one major unit × 1,000,000 (see AD-2). */
export const USD_PER_UNIT_MICROS: Readonly<Record<string, number>> = {
  USD: 1_000_000,
  INR: 12_000,
  GBP: 1_270_000,
  EUR: 1_080_000,
  CAD: 730_000,
  SGD: 740_000,
  JPY: 6_700,
};

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Sales",
  "Marketing",
  "Finance",
  "Human Resources",
  "Operations",
  "Customer Support",
  "Legal",
] as const;

export type DepartmentName = (typeof DEPARTMENTS)[number];

export interface JobTitleSeed {
  title: string;
  department: DepartmentName;
  /** Share of total headcount. */
  weight: number;
  /** Median annual base salary in the US, in USD. */
  baseUsd: number;
}

export const JOB_TITLES: readonly JobTitleSeed[] = [
  { title: "Software Engineer", department: "Engineering", weight: 18, baseUsd: 115_000 },
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    weight: 12,
    baseUsd: 155_000,
  },
  {
    title: "Staff Software Engineer",
    department: "Engineering",
    weight: 4,
    baseUsd: 200_000,
  },
  {
    title: "Engineering Manager",
    department: "Engineering",
    weight: 3,
    baseUsd: 185_000,
  },
  { title: "QA Engineer", department: "Engineering", weight: 5, baseUsd: 90_000 },
  { title: "Product Manager", department: "Product", weight: 5, baseUsd: 145_000 },
  { title: "Product Designer", department: "Product", weight: 4, baseUsd: 120_000 },
  { title: "Account Executive", department: "Sales", weight: 9, baseUsd: 95_000 },
  {
    title: "Sales Development Representative",
    department: "Sales",
    weight: 7,
    baseUsd: 62_000,
  },
  { title: "Marketing Manager", department: "Marketing", weight: 5, baseUsd: 110_000 },
  { title: "Financial Analyst", department: "Finance", weight: 5, baseUsd: 88_000 },
  {
    title: "HR Business Partner",
    department: "Human Resources",
    weight: 4,
    baseUsd: 92_000,
  },
  { title: "Operations Analyst", department: "Operations", weight: 6, baseUsd: 75_000 },
  {
    title: "Customer Support Specialist",
    department: "Customer Support",
    weight: 11,
    baseUsd: 55_000,
  },
  { title: "Legal Counsel", department: "Legal", weight: 2, baseUsd: 160_000 },
];
