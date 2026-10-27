"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Applies the chart mark specs via CSS so marks use design tokens (SVG presentation
 * attributes can't read CSS variables): one hue for every bar, hairline solid grid,
 * muted axis text, a subtle hover wash, and a lighter step for the focused bar.
 */
export function ChartFrame({
  height,
  label,
  children,
}: {
  height: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      role="figure"
      aria-label={label}
      style={{ height }}
      className={cn(
        "w-full text-xs",
        "[&_.recharts-bar-rectangle_path]:fill-chart-1",
        "[&_.recharts-active-bar_path]:fill-chart-1/80",
        "[&_.recharts-cartesian-grid_line]:stroke-border",
        "[&_.recharts-cartesian-axis-line]:stroke-border",
        "[&_.recharts-cartesian-axis-tick-line]:stroke-border",
        "[&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground",
        "[&_.recharts-tooltip-cursor]:fill-muted",
        "[&_.recharts-surface]:outline-none",
      )}
    >
      {children}
    </div>
  );
}

/** Tooltip body: the value leads (strong), the category follows (muted). */
export function ChartTooltipBody({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {detail && <p className="text-xs text-muted-foreground tabular-nums">{detail}</p>}
    </div>
  );
}
