import { Prisma } from "./generated/prisma/client";

/**
 * CTE selecting the active FX version: the one with the latest effective date (AD-2).
 * Use as `WITH ${activeFxVersionCte} SELECT …` and join `exchange_rates` on
 * `version = (SELECT version FROM active_fx)`.
 */
export const activeFxVersionCte = Prisma.sql`
  active_fx AS (
    SELECT version, effective_date
    FROM exchange_rates
    ORDER BY effective_date DESC, version DESC
    LIMIT 1
  )`;

/**
 * SQL expression converting `e.salary_minor` to USD cents, given aliases `c`
 * (countries) and `r` (exchange_rates). NULL when the currency has no active rate.
 * minor / 10^exp = major; major × micros / 1e6 = USD; × 100 = cents.
 */
export const salaryUsdCentsSql = Prisma.sql`
  ROUND(
    e.salary_minor::numeric * r.usd_per_unit_micros
      / ((10::numeric ^ c.currency_exponent) * 10000)
  )::bigint`;
