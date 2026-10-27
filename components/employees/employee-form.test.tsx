import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployeeDto } from "@/lib/services/employees";
import type { ReferenceData } from "@/lib/services/reference";
import { EmployeeForm } from "./employee-form";

const reference: ReferenceData = {
  countries: [
    { code: "GB", name: "United Kingdom", currencyCode: "GBP", currencyExponent: 2 },
    { code: "JP", name: "Japan", currencyCode: "JPY", currencyExponent: 0 },
  ],
  departments: [{ id: 1, name: "Engineering" }],
  jobTitles: ["Software Engineer"],
};

const existing: EmployeeDto = {
  id: 42,
  employeeCode: "ACME-00042",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@acme.example",
  jobTitle: "Software Engineer",
  department: { id: 1, name: "Engineering" },
  country: { code: "GB", name: "United Kingdom" },
  salary: { amountMinor: 8_000_000, currency: "GBP", exponent: 2 },
  hireDate: "2024-03-01",
  terminatedAt: null,
  createdAt: "2024-03-01T00:00:00.000Z",
  updatedAt: "2024-03-01T00:00:00.000Z",
};

const fetchMock = vi.fn();
const onSuccess = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const okResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ data }), { status });

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url, method: init.method, body: JSON.parse(init.body) };
}

async function fillNewEmployee(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("First name"), "Grace");
  await user.type(screen.getByLabelText("Last name"), "Hopper");
  await user.type(screen.getByLabelText("Email"), "grace@acme.example");
  await user.type(screen.getByLabelText("Job title"), "Software Engineer");
  await user.selectOptions(screen.getByLabelText("Department"), "1");
  await user.selectOptions(screen.getByLabelText("Country"), "GB");
  await user.type(screen.getByLabelText("Annual salary"), "85,000.50");
  await user.type(screen.getByLabelText("Hire date"), "2025-01-06");
}

describe("EmployeeForm (create)", () => {
  it("posts the employee with the salary converted to minor units", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(okResponse({ ...existing, id: 7 }, 201));
    render(<EmployeeForm reference={reference} onSuccess={onSuccess} />);

    await fillNewEmployee(user);
    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(lastRequest()).toEqual({
      url: "/api/employees",
      method: "POST",
      body: {
        firstName: "Grace",
        lastName: "Hopper",
        email: "grace@acme.example",
        jobTitle: "Software Engineer",
        departmentId: 1,
        countryCode: "GB",
        salaryMinor: 8_500_050,
        hireDate: "2025-01-06",
      },
    });
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it("shows inline errors from the shared schema without calling the API", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm reference={reference} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("First name")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("First name")).toHaveAccessibleDescription("Required");
  });

  it("shows the currency for the selected country", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm reference={reference} onSuccess={onSuccess} />);

    await user.selectOptions(screen.getByLabelText("Country"), "JP");

    expect(screen.getByTestId("salary-currency")).toHaveTextContent("JPY");
  });

  it("rejects decimals for a zero-decimal currency", async () => {
    const user = userEvent.setup();
    render(<EmployeeForm reference={reference} onSuccess={onSuccess} />);

    await user.selectOptions(screen.getByLabelText("Country"), "JP");
    await user.type(screen.getByLabelText("Annual salary"), "9000000.5");
    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(screen.getByLabelText("Annual salary")).toHaveAccessibleDescription(
      "Enter a whole amount, e.g. 9000000",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a duplicate-email conflict from the server on the email field", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "CONFLICT",
            message: "Duplicate",
            details: { email: "Already in use" },
          },
        }),
        { status: 409 },
      ),
    );
    render(<EmployeeForm reference={reference} onSuccess={onSuccess} />);

    await fillNewEmployee(user);
    await user.click(screen.getByRole("button", { name: "Add employee" }));

    expect(await screen.findByText("Already in use")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("First name")).toHaveValue("Grace");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("EmployeeForm (edit)", () => {
  it("sends only changed fields", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(okResponse(existing));
    render(
      <EmployeeForm reference={reference} employee={existing} onSuccess={onSuccess} />,
    );

    const title = screen.getByLabelText("Job title");
    await user.clear(title);
    await user.type(title, "Staff Engineer");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(lastRequest()).toEqual({
      url: "/api/employees/42",
      method: "PATCH",
      body: { jobTitle: "Staff Engineer" },
    });
  });

  it("asks for a reason only when the salary changes, and sends it", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(okResponse(existing));
    render(
      <EmployeeForm reference={reference} employee={existing} onSuccess={onSuccess} />,
    );
    expect(
      screen.queryByLabelText("Reason for change (optional)"),
    ).not.toBeInTheDocument();

    const salary = screen.getByLabelText("Annual salary");
    await user.clear(salary);
    await user.type(salary, "88000");
    await user.type(screen.getByLabelText("Reason for change (optional)"), "Promotion");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(lastRequest().body).toEqual({
      salaryMinor: 8_800_000,
      salaryChangeReason: "Promotion",
    });
  });

  it("always sends the salary with a country change", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(okResponse(existing));
    render(
      <EmployeeForm reference={reference} employee={existing} onSuccess={onSuccess} />,
    );

    await user.selectOptions(screen.getByLabelText("Country"), "JP");
    const salary = screen.getByLabelText("Annual salary");
    await user.clear(salary);
    await user.type(salary, "15000000");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(lastRequest().body).toEqual({ countryCode: "JP", salaryMinor: 15_000_000 });
  });

  it("does not call the API when nothing changed", async () => {
    const user = userEvent.setup();
    render(
      <EmployeeForm reference={reference} employee={existing} onSuccess={onSuccess} />,
    );

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByRole("alert")).toHaveTextContent("No changes to save.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
