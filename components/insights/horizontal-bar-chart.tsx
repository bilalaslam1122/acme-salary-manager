"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { horizontalChartHeight, type GroupBarRow } from "@/lib/insights/chart-data";
import { ChartFrame, ChartTooltipBody } from "./chart-frame";

export type BarMeasure = "medianUsd" | "headcount";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
});
const count = new Intl.NumberFormat("en-US");
const countCompact = new Intl.NumberFormat("en-US", { notation: "compact" });

const FORMATS: Record<
  BarMeasure,
  { full: (n: number) => string; tick: (n: number) => string }
> = {
  medianUsd: { full: (n) => usd.format(n), tick: (n) => usdCompact.format(n) },
  headcount: { full: (n) => count.format(n), tick: (n) => countCompact.format(n) },
};

/**
 * Single-series horizontal bars (one hue for every bar: the categories are nominal).
 * Bars ≤ 24px with a 4px rounded data end, square at the baseline.
 */
export function HorizontalBarChart({
  rows,
  measure,
  label,
  categoryWidth = 120,
}: {
  rows: GroupBarRow[];
  measure: BarMeasure;
  label: string;
  categoryWidth?: number;
}) {
  const format = FORMATS[measure];
  return (
    <ChartFrame height={horizontalChartHeight(rows.length)} label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={format.tick}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={categoryWidth}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as GroupBarRow | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBody
                  value={format.full(row[measure])}
                  label={row.label}
                  detail={
                    measure === "medianUsd"
                      ? `Median of ${count.format(row.headcount)} employees`
                      : undefined
                  }
                />
              );
            }}
          />
          <Bar
            dataKey={measure}
            maxBarSize={24}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
