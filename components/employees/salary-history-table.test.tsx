import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SalaryChangeDto } from "@/lib/services/salary-history";
import { SalaryHistoryTable } from "./salary-history-table";

const gbp = (amountMinor: number) => ({ amountMinor, currency: "GBP", exponent: 2 });

const rows: SalaryChangeDto[] = [
  {
    id: 3,
    changedAt: "2026-04-01T09:00:00.000Z",
    oldSalary: gbp(8_800_000),
    newSalary: { amountMinor: 15_000_000, currency: "JPY", exponent: 0 },
    changePercent: null,
    reason: "Relocation",
    changedBy: { id: 1, name: "HR Manager" },
  },
  {
    id: 2,
    changedAt: "2025-03-01T09:00:00.000Z",
    oldSalary: gbp(8_000_000),
    newSalary: gbp(8_800_000),
    changePercent: 10,
    reason: null,
    changedBy: null,
  },
  {
    id: 1,
    changedAt: "2024-03-01T09:00:00.000Z",
    oldSalary: null,
    newSalary: gbp(8_000_000),
    changePercent: null,
    reason: "Initial salary",
    changedBy: null,
  },
];

describe("SalaryHistoryTable", () => {
  it("shows a raise with its percentage and the system as author", () => {
    render(<SalaryHistoryTable rows={rows} />);
    const row = screen.getByRole("row", { name: /01 Mar 2025/ });

    expect(within(row).getByText("£80,000")).toBeInTheDocument();
    expect(within(row).getByText("£88,000")).toBeInTheDocument();
    expect(within(row).getByText("+10.0%")).toBeInTheDocument();
    expect(within(row).getByText("System")).toBeInTheDocument();
  });

  it("shows a currency move instead of a percentage", () => {
    render(<SalaryHistoryTable rows={rows} />);
    const row = screen.getByRole("row", { name: /01 Apr 2026/ });

    expect(within(row).getByText("GBP → JPY")).toBeInTheDocument();
    expect(within(row).getByText("¥15,000,000")).toBeInTheDocument();
    expect(within(row).getByText("HR Manager")).toBeInTheDocument();
  });

  it("labels the initial salary", () => {
    render(<SalaryHistoryTable rows={rows} />);
    const row = screen.getByRole("row", { name: /01 Mar 2024/ });

    expect(within(row).getByText("Initial")).toBeInTheDocument();
  });

  it("shows an empty state without rows", () => {
    render(<SalaryHistoryTable rows={[]} />);
    expect(screen.getByText("No salary changes yet.")).toBeInTheDocument();
  });
});
