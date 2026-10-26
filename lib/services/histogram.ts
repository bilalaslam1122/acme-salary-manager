/** Target number of histogram buckets (open question 8). */
export const HISTOGRAM_BUCKETS = 20;
/** Bucket edges and widths are multiples of $5,000, in USD cents. */
export const HISTOGRAM_ROUNDING_CENTS = 500_000;

export interface HistogramLayout {
  startCents: number;
  widthCents: number;
  bucketCount: number;
}

/**
 * Equal-width buckets covering [min, max], with the start and width rounded to
 * $5k. Rounding can leave fewer than 20 buckets but never more: values past the
 * last edge fall into the last bucket.
 */
export function histogramLayout(minCents: number, maxCents: number): HistogramLayout {
  const step = HISTOGRAM_ROUNDING_CENTS;
  const startCents = Math.floor(minCents / step) * step;
  const rawWidth = (maxCents - minCents) / HISTOGRAM_BUCKETS;
  const widthCents = Math.max(step, Math.ceil(rawWidth / step) * step);
  const bucketCount = Math.min(
    HISTOGRAM_BUCKETS,
    Math.floor((maxCents - startCents) / widthCents) + 1,
  );
  return { startCents, widthCents, bucketCount };
}
