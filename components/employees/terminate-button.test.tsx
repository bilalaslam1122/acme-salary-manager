import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TerminateButton } from "./terminate-button";

const router = { refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("TerminateButton", () => {
  it("does nothing until the termination is confirmed", async () => {
    const user = userEvent.setup();
    render(<TerminateButton employeeId={42} name="Ada Lovelace" />);

    await user.click(screen.getByRole("button", { name: "Terminate" }));
    expect(
      screen.getByRole("alertdialog", { name: "Terminate Ada Lovelace?" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends DELETE and refreshes once confirmed", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    render(<TerminateButton employeeId={42} name="Ada Lovelace" />);

    await user.click(screen.getByRole("button", { name: "Terminate" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "Terminate",
      )!,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/employees/42", { method: "DELETE" });
    expect(toast.success).toHaveBeenCalledWith("Ada Lovelace terminated");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("reports a failure without refreshing", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    render(<TerminateButton employeeId={42} name="Ada Lovelace" />);

    await user.click(screen.getByRole("button", { name: "Terminate" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "Terminate",
      )!,
    );

    expect(toast.error).toHaveBeenCalledWith("Could not terminate. Try again.");
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
