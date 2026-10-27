// Display-only conversion from integer minor units (AD-1). Fixed locale so output is
// deterministic across machines and in tests. Salaries are annual, so no decimals.

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  let cached = formatters.get(currency);
  if (!cached) {
    cached = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    formatters.set(currency, cached);
  }
  return cached;
}

/** e.g. (8_000_000, "GBP", 2) → "£80,000"; (9_000_000, "JPY", 0) → "¥9,000,000". */
export function formatMoney(
  amountMinor: number,
  currency: string,
  exponent: number,
): string {
  return formatter(currency).format(amountMinor / 10 ** exponent);
}

/** e.g. 6_350_000 → "$63,500". */
export function formatUsdCents(cents: number): string {
  return formatMoney(cents, "USD", 2);
}
