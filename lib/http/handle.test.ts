import { notFound } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { handle, json, parseInput, readJson, toErrorResponse } from "./handle";

describe("handle", () => {
  it("rethrows Next.js control-flow errors instead of returning a 500", async () => {
    const route = handle(async () => notFound());
    await expect(route()).rejects.toThrow();
  });

  it("maps application errors to a response", async () => {
    const route = handle(async () => {
      throw new NotFoundError("missing");
    });
    expect((await route()).status).toBe(404);
  });
});

describe("handle caching", () => {
  it("marks API responses private and uncacheable, since they carry salary data", async () => {
    const ok = await handle(async () => json({ salary: 1 }))();
    const failed = await handle(async () => {
      throw new NotFoundError("gone");
    })();

    expect(ok.headers.get("cache-control")).toBe("private, no-store");
    expect(failed.headers.get("cache-control")).toBe("private, no-store");
  });

  it("keeps a cache policy the handler set itself", async () => {
    const route = handle(
      async () => new Response("x", { headers: { "cache-control": "no-store" } }),
    );
    expect((await route()).headers.get("cache-control")).toBe("no-store");
  });
});

describe("toErrorResponse", () => {
  it("maps NotFoundError to 404", async () => {
    const response = toErrorResponse(new NotFoundError("Employee 9 not found"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Employee 9 not found" },
    });
  });

  it("maps ConflictError to 409 with details", async () => {
    const response = toErrorResponse(
      new ConflictError("Duplicate", { email: "Already in use" }),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error.details).toEqual({ email: "Already in use" });
  });

  it("maps ValidationError to 400 with field errors", async () => {
    const response = toErrorResponse(
      new ValidationError("Invalid", { departmentId: "Unknown department" }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.details).toEqual({
      fieldErrors: { departmentId: "Unknown department" },
    });
  });

  it("maps unexpected errors to 500 without leaking the message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = toErrorResponse(new Error("relation employees does not exist"));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("relation");
  });
});

describe("parseInput", () => {
  it("turns schema failures into a 400 keyed by field path", async () => {
    const schema = z.object({ salaryMinor: z.number() });
    const response = toErrorResponse(captureError(() => parseInput(schema, {})));
    expect(response.status).toBe(400);
    expect((await response.json()).error.details.fieldErrors).toHaveProperty(
      "salaryMinor",
    );
  });
});

describe("readJson", () => {
  it("rejects malformed JSON with a 400", async () => {
    const request = new Request("http://test", { method: "POST", body: "{nope" });
    const route = handle(async () => {
      await readJson(request);
      return new Response(null);
    });
    expect((await route()).status).toBe(400);
  });
});

function captureError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected function to throw");
}
