import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "./sign-out-button";

const fetchMock = vi.fn();
const replace = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, replace },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("SignOutButton", () => {
  it("clears the session, then reloads the login page to drop cached signed-in pages", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    render(<SignOutButton />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(replace).toHaveBeenCalledWith("/login");
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(
      replace.mock.invocationCallOrder[0]!,
    );
  });

  it("still leaves the signed-in pages if the network call fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    render(<SignOutButton />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }));

    expect(replace).toHaveBeenCalledWith("/login");
  });
});
