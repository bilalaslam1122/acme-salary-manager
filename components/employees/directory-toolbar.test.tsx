import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReferenceData } from "@/lib/services/reference";
import { parseDirectoryQuery } from "@/lib/validation/directory-url";
import { DirectoryToolbar, SEARCH_DEBOUNCE_MS } from "./directory-toolbar";

const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const reference: ReferenceData = {
  countries: [
    { code: "IN", name: "India", currencyCode: "INR", currencyExponent: 2 },
    { code: "JP", name: "Japan", currencyCode: "JPY", currencyExponent: 0 },
  ],
  departments: [{ id: 3, name: "Sales" }],
  jobTitles: ["Account Executive"],
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

function renderToolbar(params: Record<string, string> = {}) {
  return render(
    <DirectoryToolbar query={parseDirectoryQuery(params)} reference={reference} />,
  );
}

describe("DirectoryToolbar", () => {
  it("updates the URL once typing pauses, resetting to page 1", () => {
    renderToolbar({ page: "4" });
    const search = screen.getByRole("searchbox", { name: "Search employees" });

    fireEvent.change(search, { target: { value: "sat" } });
    fireEvent.change(search, { target: { value: "sato" } });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(router.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/employees?q=sato");
  });

  it("filters by country and keeps other filters", () => {
    renderToolbar({ departmentId: "3", page: "2" });

    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "IN" } });

    expect(router.push).toHaveBeenCalledWith("/employees?countryCode=IN&departmentId=3");
  });

  it("clears a filter when 'All' is chosen", () => {
    renderToolbar({ countryCode: "JP" });

    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "" } });

    expect(router.push).toHaveBeenCalledWith("/employees");
  });

  it("switches to terminated employees, most recent leaver first", () => {
    renderToolbar({ page: "5" });
    const status = screen.getByRole("group", { name: "Status" });

    expect(within(status).getByRole("button", { name: "Active" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(status).getByRole("button", { name: "Terminated" }));

    expect(router.push).toHaveBeenCalledWith(
      "/employees?status=terminated&sort=terminatedAt&order=desc",
    );
  });

  it("shows the current status from the URL", () => {
    renderToolbar({ status: "all" });

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the current filters from the URL", () => {
    renderToolbar({ countryCode: "JP", q: "kenji" });

    expect(screen.getByLabelText("Country")).toHaveValue("JP");
    expect(screen.getByRole("searchbox", { name: "Search employees" })).toHaveValue(
      "kenji",
    );
  });
});
