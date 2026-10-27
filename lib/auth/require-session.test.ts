import { describe, expect, it } from "vitest";
import { UnauthorizedError } from "@/lib/errors";
import { readCookie, requireSession } from "./require-session";
import { createSessionToken, SESSION_COOKIE } from "./session";

const withCookie = (cookie?: string) =>
  new Request("http://localhost/api/employees", {
    headers: cookie ? { cookie } : {},
  });

describe("readCookie", () => {
  it("finds a cookie among several", () => {
    expect(readCookie(withCookie("a=1; acme_session=abc.def; b=2"), "acme_session")).toBe(
      "abc.def",
    );
  });

  it("keeps '=' characters inside the value", () => {
    expect(readCookie(withCookie("token=a=b=c"), "token")).toBe("a=b=c");
  });

  it("returns undefined when absent", () => {
    expect(readCookie(withCookie(), "acme_session")).toBeUndefined();
  });
});

describe("requireSession", () => {
  it("returns the session for a valid cookie", async () => {
    const token = await createSessionToken({
      userId: 3,
      email: "hr@acme.example",
      name: "HR",
    });
    const session = await requireSession(withCookie(`${SESSION_COOKIE}=${token}`));
    expect(session.userId).toBe(3);
  });

  it("throws UnauthorizedError without a cookie", async () => {
    await expect(requireSession(withCookie())).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError for a garbage cookie", async () => {
    await expect(requireSession(withCookie(`${SESSION_COOKIE}=nope`))).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
