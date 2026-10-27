import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const router = { replace: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  window.history.pushState({}, "", "/login");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function submit(email = "hr@acme.example", password = "secret-password") {
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  it("posts the credentials as JSON", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await submit();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "hr@acme.example", password: "secret-password" }),
      }),
    );
  });

  it("goes to the requested page after signing in", async () => {
    window.history.pushState({}, "", "/login?next=%2Femployees%3FcountryCode%3DIN");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await submit();

    expect(router.replace).toHaveBeenCalledWith("/employees?countryCode=IN");
  });

  it("ignores an off-site next parameter", async () => {
    window.history.pushState({}, "", "/login?next=https%3A%2F%2Fevil.example");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await submit();

    expect(router.replace).toHaveBeenCalledWith("/employees");
  });

  it("shows an error and stays on the page for wrong credentials", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("shows a connection error when the request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not reach the server",
    );
  });
});
