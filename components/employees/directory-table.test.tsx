import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EmployeeListItem } from "@/lib/services/employee-directory";
import { parseDirectoryQuery } from "@/lib/validation/directory-url";
import { DirectoryTable } from "./directory-table";

const employee: EmployeeListItem = {
  id: 1,
  employeeCode: "ACME-00001",
  firstName: "Kenji",
  lastName: "Sato",
  email: "kenji.sato@acme.example",
  jobTitle: "Software Engineer",
  department: { id: 1, name: "Engineering" },
  country: { code: "JP", name: "Japan" },
  salary: { amountMinor: 10_000_000, currency: "JPY", exponent: 0 },
  salaryUsdCents: 6_700_000,
  hireDate: "2024-03-01",
  terminatedAt: null,
};

describe("DirectoryTable", () => {
  it("shows local and USD salary for each employee", () => {
    render(
      <DirectoryTable rows={[employee]} query={parseDirectoryQuery({})} total={1} />,
    );
    const row = screen.getByRole("row", { name: /Sato, Kenji/ });

    expect(within(row).getByText("¥10,000,000")).toBeInTheDocument();
    expect(within(row).getByText("$67,000")).toBeInTheDocument();
    expect(within(row).getByText("ACME-00001")).toBeInTheDocument();
  });

  it("marks terminated employees", () => {
    render(
      <DirectoryTable
        rows={[{ ...employee, terminatedAt: "2026-01-01T00:00:00.000Z" }]}
        query={parseDirectoryQuery({ includeTerminated: "true" })}
        total={1}
      />,
    );
    expect(screen.getByText("Terminated")).toBeInTheDocument();
  });

  it("exposes the active sort to assistive tech and links to the reversed sort", () => {
    render(
      <DirectoryTable
        rows={[employee]}
        query={parseDirectoryQuery({ sort: "salaryUsd" })}
        total={1}
      />,
    );
    const header = screen.getByRole("columnheader", { name: /Salary \(USD\)/ });

    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(within(header).getByRole("link")).toHaveAttribute(
      "href",
      "/employees?sort=salaryUsd&order=desc",
    );
    expect(screen.getByRole("columnheader", { name: /Hire date/ })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  it("shows an empty state with a way to clear filters", () => {
    render(
      <DirectoryTable
        rows={[]}
        query={parseDirectoryQuery({ countryCode: "SG" })}
        total={0}
      />,
    );

    expect(screen.getByText("No employees match these filters.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/employees",
    );
  });

  it("points to Add employee when there are no employees at all", () => {
    render(<DirectoryTable rows={[]} query={parseDirectoryQuery({})} total={0} />);

    expect(screen.getByText(/No employees yet/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("offers the first page when the page is past the end of the results", () => {
    render(
      <DirectoryTable
        rows={[]}
        query={parseDirectoryQuery({ countryCode: "JP", page: "99" })}
        total={587}
      />,
    );

    expect(
      screen.getByText("This page is past the end of the results."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the first page" })).toHaveAttribute(
      "href",
      "/employees?countryCode=JP",
    );
  });
});
