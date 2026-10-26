import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { handle, parseInput, readJson, toErrorResponse } from "./handle";

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
