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
import type { HistogramRow } from "@/lib/insights/chart-data";
import { ChartFrame, ChartTooltipBody } from "./chart-frame";

const count = new Intl.NumberFormat("en-US");
const countCompact = new Intl.NumberFormat("en-US", { notation: "compact" });

/** Salary distribution: one hue, columns ≤ 24px with rounded caps, 2px gaps. */
export function HistogramChart({ rows }: { rows: HistogramRow[] }) {
  return (
    <ChartFrame height={280} label="Salary distribution in USD">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          barCategoryGap={2}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={8} />
          <YAxis
            tickFormatter={(n: number) => countCompact.format(n)}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as HistogramRow | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltipBody
                  value={`${count.format(row.count)} employees`}
                  label={row.range}
                />
              );
            }}
          />
          <Bar
            dataKey="count"
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
