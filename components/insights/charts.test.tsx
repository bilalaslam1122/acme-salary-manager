import { render, screen } from "@testing-library/react";
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { GroupBarRow, HistogramRow } from "@/lib/insights/chart-data";
import { HistogramChart } from "./histogram-chart";
import { HorizontalBarChart } from "./horizontal-bar-chart";

// jsdom has no layout, so ResponsiveContainer would measure 0×0 and draw nothing.
// Give the real chart a fixed size instead.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) =>
      isValidElement(children)
        ? cloneElement(children as ReactElement<{ width: number; height: number }>, {
            width: 800,
            height: 400,
          })
        : null,
  };
});

const rows: GroupBarRow[] = [
  { key: "US", label: "United States", medianUsd: 105_701, headcount: 2_979 },
  { key: "SG", label: "Singapore", medianUsd: 89_984, headcount: 727 },
  { key: "IN", label: "India", medianUsd: 31_860, headcount: 2_011 },
];

function bars(container: HTMLElement) {
  return container.querySelectorAll(".recharts-bar-rectangle path");
}

describe("HorizontalBarChart", () => {
  it("draws one bar per group with category labels", () => {
    const { container } = render(
      <HorizontalBarChart
        rows={rows}
        measure="medianUsd"
        label="Median salary by country"
      />,
    );

    expect(
      screen.getByRole("figure", { name: "Median salary by country" }),
    ).toBeInTheDocument();
    expect(bars(container)).toHaveLength(3);
    for (const label of ["United States", "Singapore", "India"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("formats compact currency on the value axis", () => {
    render(<HorizontalBarChart rows={rows} measure="medianUsd" label="Median" />);
    expect(screen.getAllByText(/^\$\d+K$/).length).toBeGreaterThan(0);
  });
});

describe("HistogramChart", () => {
  const histogram: HistogramRow[] = [
    { label: "$30K", range: "$30K–$35K", count: 120 },
    { label: "$35K", range: "$35K–$40K", count: 0 },
    { label: "$40K", range: "$40K–$45K", count: 340 },
  ];

  it("draws a column for every non-empty bucket and labels buckets by lower edge", () => {
    const { container } = render(<HistogramChart rows={histogram} />);

    expect(
      screen.getByRole("figure", { name: "Salary distribution in USD" }),
    ).toBeVisible();
    // Zero-height buckets draw no path; the empty $35K bucket still keeps its slot.
    expect(bars(container)).toHaveLength(2);
    expect(screen.getByText("$35K")).toBeInTheDocument();
  });
});
