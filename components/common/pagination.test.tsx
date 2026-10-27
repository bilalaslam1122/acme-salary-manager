import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pagination, type PaginationProps } from "./pagination";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  vi.clearAllMocks();
});

const hrefForPage = (page: number) =>
  page === 1 ? "/employees" : `/employees?page=${page}`;

function renderPagination(overrides: Partial<PaginationProps> = {}) {
  return render(
    <Pagination
      page={7}
      pageSize={50}
      total={10_000}
      totalPages={200}
      hrefForPage={hrefForPage}
      itemLabel={{ singular: "employee", plural: "employees" }}
      label="Employee pages"
      pageSizeOptions={[25, 50, 100].map((size) => ({
        size,
        href: `/employees?pageSize=${size}`,
      }))}
      {...overrides}
    />,
  );
}

describe("Pagination", () => {
  it("summarises the visible range", () => {
    renderPagination();
    expect(screen.getByText(/Showing/)).toHaveTextContent(
      "Showing 301–350 of 10,000 employees",
    );
  });

  it("shows first, last and neighbouring pages with the current page marked", () => {
    renderPagination();
    const nav = screen.getByRole("navigation", { name: "Employee pages" });
    const pages = within(nav)
      .getAllByRole("link", { name: /^Page \d+$/ })
      .map((link) => link.textContent);

    expect(pages).toEqual(["1", "6", "7", "8", "200"]);
    expect(within(nav).getByRole("link", { name: "Page 7" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Page 200" })).toHaveAttribute(
      "href",
      "/employees?page=200",
    );
  });

  it("links previous, next, first and last", () => {
    renderPagination();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/employees?page=6",
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/employees?page=8",
    );
    expect(screen.getByRole("link", { name: "First page" })).toHaveAttribute(
      "href",
      "/employees",
    );
    expect(screen.getByRole("link", { name: "Last page" })).toHaveAttribute(
      "href",
      "/employees?page=200",
    );
  });

  it("disables first and previous on the first page", () => {
    renderPagination({ page: 1 });
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Next page" })).toBeInTheDocument();
  });

  it("disables next and last on the last page", () => {
    renderPagination({ page: 200 });
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
  });

  it("hides ellipses from assistive tech", () => {
    const { container } = renderPagination();
    const ellipses = Array.from(container.querySelectorAll("li")).filter(
      (li) => li.textContent === "…",
    );
    expect(ellipses).toHaveLength(2);
    for (const ellipsis of ellipses)
      expect(ellipsis).toHaveAttribute("aria-hidden", "true");
  });

  it("offers a way back from a page past the end", () => {
    renderPagination({ page: 999 });
    expect(screen.getByText(/Page 999 doesn't exist/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the last page" })).toHaveAttribute(
      "href",
      "/employees?page=200",
    );
  });

  it("omits page navigation when everything fits on one page", () => {
    renderPagination({ page: 1, total: 3, totalPages: 1 });
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 1–3 of 3 employees");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("uses the singular noun for one item", () => {
    renderPagination({ page: 1, total: 1, totalPages: 1 });
    expect(screen.getByText(/Showing/)).toHaveTextContent("of 1 employee");
  });

  it("changes rows per page via its canonical URL", async () => {
    const user = userEvent.setup();
    renderPagination();

    await user.selectOptions(screen.getByLabelText("Rows per page"), "100");

    expect(router.push).toHaveBeenCalledWith("/employees?pageSize=100");
  });

  it("jumps to a typed page, clamped to the last page", async () => {
    const user = userEvent.setup();
    renderPagination();

    await user.type(screen.getByLabelText("Go to page"), "500");
    await user.click(screen.getByRole("button", { name: "Go" }));

    expect(router.push).toHaveBeenCalledWith("/employees?page=200");
  });

  it("jumps to page 1 using its canonical URL", async () => {
    const user = userEvent.setup();
    renderPagination();

    await user.type(screen.getByLabelText("Go to page"), "0");
    await user.click(screen.getByRole("button", { name: "Go" }));

    expect(router.push).toHaveBeenCalledWith("/employees");
  });

  it("offers no jump control for short lists", () => {
    renderPagination({ total: 300, totalPages: 6, page: 2 });
    expect(screen.queryByLabelText("Go to page")).not.toBeInTheDocument();
  });
});
