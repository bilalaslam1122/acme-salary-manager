/**
 * Parses a user-typed amount in major units ("85,000", "85000.50") into integer
 * minor units without floating-point maths. Returns null for anything that is not a
 * plain positive amount, or that has more decimals than the currency allows.
 */
export function parseMajorToMinor(input: string, exponent: number): number | null {
  const cleaned = input.trim().replace(/[,\s]/g, "");
  const match = /^(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) return null;

  const [, whole = "", fraction = ""] = match;
  if (fraction.length > exponent) return null;

  const minor = Number(whole + fraction.padEnd(exponent, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Inverse for pre-filling forms: (8_500_050, 2) → "85000.5". */
export function minorToMajorInput(amountMinor: number, exponent: number): string {
  if (exponent === 0) return String(amountMinor);
  const text = String(amountMinor).padStart(exponent + 1, "0");
  const whole = text.slice(0, -exponent);
  const fraction = text.slice(-exponent).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}
