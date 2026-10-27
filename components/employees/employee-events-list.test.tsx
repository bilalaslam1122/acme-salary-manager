import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EmployeeEventDto } from "@/lib/services/employee-events";
import { EmployeeEventsList } from "./employee-events-list";

const promotion: EmployeeEventDto = {
  id: 2,
  type: "UPDATED",
  changedAt: "2026-06-01T09:00:00.000Z",
  changes: { "Job title": { from: "Engineer", to: "Senior Engineer" } },
  reason: null,
  changedBy: { id: 1, name: "HR Manager" },
};

const termination: EmployeeEventDto = {
  id: 3,
  type: "TERMINATED",
  changedAt: "2026-09-30T09:00:00.000Z",
  changes: null,
  reason: "Resigned",
  changedBy: null,
};

describe("EmployeeEventsList", () => {
  it("shows what changed, from what, and who changed it", () => {
    render(<EmployeeEventsList events={[promotion]} />);

    expect(screen.getByText("Details updated")).toBeInTheDocument();
    expect(screen.getByText("Job title")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText(/Senior Engineer/)).toBeInTheDocument();
    expect(screen.getByText("by HR Manager")).toBeInTheDocument();
  });

  it("shows the reason for a termination and attributes seeded events to the system", () => {
    render(<EmployeeEventsList events={[termination]} />);

    expect(screen.getByText("Terminated")).toBeInTheDocument();
    expect(screen.getByText("Resigned")).toBeInTheDocument();
    expect(screen.getByText("by System")).toBeInTheDocument();
    expect(screen.getByText("30 Sept 2026")).toBeInTheDocument();
  });

  it("explains an empty trail", () => {
    render(<EmployeeEventsList events={[]} />);

    expect(
      screen.getByText("No changes since this employee was added."),
    ).toBeInTheDocument();
  });
});
