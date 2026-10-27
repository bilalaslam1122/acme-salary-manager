// RFC 4180 CSV for spreadsheet export. Pure, so it is unit tested without a database.

export type CsvValue = string | number | null;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

/** Excel opens UTF-8 CSV correctly (names, ¥, €) only when the file starts with a BOM. */
export const UTF8_BOM = "﻿";

// A cell starting with one of these is run as a formula by Excel and Sheets.
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

/**
 * Text cells are user input (names, job titles), so a leading formula character is
 * neutralised with an apostrophe (OWASP "CSV injection"). Numbers are written as-is.
 */
function cell(value: CsvValue): string {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  const safe = FORMULA_TRIGGERS.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: readonly T[]): string {
  const lines = [columns.map((c) => cell(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => cell(c.value(row))).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

/**
 * Exact decimal text for an integer amount in minor units, for spreadsheet maths:
 * (8_000_050, 2) → "80000.50", (9_000_000, 0) → "9000000". No floating point.
 */
export function minorToDecimal(amountMinor: number, exponent: number): string {
  if (exponent === 0) return String(amountMinor);
  const sign = amountMinor < 0 ? "-" : "";
  const digits = String(Math.abs(amountMinor)).padStart(exponent + 1, "0");
  return `${sign}${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}
