import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmploymentActionButton } from "./employment-action-button";

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

async function openDialog(action: "terminate" | "reinstate") {
  const user = userEvent.setup();
  render(<EmploymentActionButton action={action} employeeId={42} name="Ada Lovelace" />);
  const label = action === "terminate" ? "Terminate" : "Reinstate";
  await user.click(screen.getByRole("button", { name: label }));
  const dialog = screen.getByRole("alertdialog", { name: `${label} Ada Lovelace?` });
  return { user, dialog, confirm: within(dialog).getByRole("button", { name: label }) };
}

describe("EmploymentActionButton", () => {
  it("does nothing until the action is confirmed", async () => {
    const { user, dialog } = await openDialog("terminate");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a reason before sending anything", async () => {
    const { user, dialog, confirm } = await openDialog("terminate");

    await user.click(confirm);

    expect(within(dialog).getByText("Give a reason")).toBeVisible();
    expect(within(dialog).getByLabelText("Reason")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("terminates with the reason and refreshes", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { user, dialog, confirm } = await openDialog("terminate");

    await user.type(within(dialog).getByLabelText("Reason"), "Resigned");
    await user.click(confirm);

    expect(fetchMock).toHaveBeenCalledWith("/api/employees/42/terminate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Resigned" }),
    });
    expect(toast.success).toHaveBeenCalledWith("Ada Lovelace terminated");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("reinstates through its own endpoint", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { user, dialog, confirm } = await openDialog("reinstate");

    await user.type(within(dialog).getByLabelText("Reason"), "Terminated by mistake");
    await user.click(confirm);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/employees/42/reinstate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Ada Lovelace reinstated");
  });

  it("reports a failure without refreshing", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    const { user, dialog, confirm } = await openDialog("terminate");

    await user.type(within(dialog).getByLabelText("Reason"), "Resigned");
    await user.click(confirm);

    expect(toast.error).toHaveBeenCalledWith("Could not terminate. Try again.");
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
