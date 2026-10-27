import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { config, proxy } from "./proxy";

let validCookie: string;

beforeAll(async () => {
  const token = await createSessionToken({
    userId: 1,
    email: "hr@acme.example",
    name: "HR",
  });
  validCookie = `${SESSION_COOKIE}=${token}`;
});

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

const passedThrough = (response: Response) =>
  response.headers.get("x-middleware-next") === "1";

describe("proxy without a session", () => {
  it("redirects pages to /login and remembers where the user was going", async () => {
    const response = await proxy(request("/employees?page=2"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/employees?page=2");
  });

  it("returns 401 JSON for API routes", async () => {
    const response = await proxy(request("/api/employees"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Sign in to continue" },
    });
  });

  it("rejects an invalid session cookie", async () => {
    const response = await proxy(
      request("/api/insights/summary", `${SESSION_COOKIE}=forged`),
    );
    expect(response.status).toBe(401);
  });

  it.each(["/login", "/api/auth/login", "/api/auth/logout"])(
    "lets %s through",
    async (path) => {
      expect(passedThrough(await proxy(request(path)))).toBe(true);
    },
  );
});

describe("proxy with a valid session", () => {
  it.each(["/", "/employees", "/api/employees", "/api/insights/summary"])(
    "lets %s through",
    async (path) => {
      expect(passedThrough(await proxy(request(path, validCookie)))).toBe(true);
    },
  );

  it("sends a signed-in user away from /login", async () => {
    const response = await proxy(request("/login", validCookie));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });
});

describe("proxy matcher", () => {
  const matcher = new RegExp(`^${config.matcher[0]!}$`);

  it.each(["/", "/employees/12", "/api/employees", "/login"])("covers %s", (path) => {
    expect(matcher.test(path)).toBe(true);
  });

  it.each(["/_next/static/chunks/app.js", "/_next/image", "/favicon.ico"])(
    "skips %s",
    (path) => {
      expect(matcher.test(path)).toBe(false);
    },
  );
});
