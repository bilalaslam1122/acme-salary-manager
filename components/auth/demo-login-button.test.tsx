import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoLoginButton } from "./demo-login-button";

const router = { replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("DemoLoginButton", () => {
  it("signs in as the demo account and goes to the requested page", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    window.history.replaceState(null, "", "/login?next=%2Finsights");
    render(<DemoLoginButton />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Explore the live demo" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/demo", { method: "POST" });
    expect(router.replace).toHaveBeenCalledWith("/insights");
  });

  it("explains a failure without navigating", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 404 }));
    render(<DemoLoginButton />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Explore the live demo" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The demo account is not available right now.",
    );
    expect(router.replace).not.toHaveBeenCalled();
  });
});
