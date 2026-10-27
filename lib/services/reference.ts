import "server-only";
import { prisma } from "@/lib/db/client";

export interface ReferenceData {
  countries: {
    code: string;
    name: string;
    currencyCode: string;
    currencyExponent: number;
  }[];
  departments: { id: number; name: string }[];
  /** Titles in use, for filters and the form combobox (open question 5). */
  jobTitles: string[];
}

/** Small lookup lists for filters and forms (8 countries, 9 departments, ~15 titles). */
export async function getReferenceData(): Promise<ReferenceData> {
  const [countries, departments, titles] = await Promise.all([
    prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { code: true, name: true, currencyCode: true, currencyExponent: true },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.employee.findMany({
      distinct: ["jobTitle"],
      orderBy: { jobTitle: "asc" },
      select: { jobTitle: true },
    }),
  ]);
  return { countries, departments, jobTitles: titles.map((t) => t.jobTitle) };
}
