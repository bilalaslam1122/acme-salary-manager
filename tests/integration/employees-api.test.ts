import { beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET, PATCH } from "@/app/api/employees/[id]/route";
import { POST } from "@/app/api/employees/route";
import { employeePayload, seedReferenceData } from "./factories";

function request(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/employees", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function ctx(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) };
}

async function createViaApi(overrides: Record<string, unknown> = {}) {
  const response = await POST(request("POST", await employeePayload(overrides)));
  return (await response.json()).data as { id: number };
}

beforeEach(async () => {
  await seedReferenceData();
});

describe("POST /api/employees", () => {
  it("returns 201 with the created employee under data", async () => {
    const response = await POST(
      request("POST", await employeePayload({ firstName: "Grace" })),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({ firstName: "Grace", salary: { currency: "GBP" } });
  });

  it("returns 400 with field errors for an invalid body", async () => {
    const response = await POST(request("POST", { firstName: "" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.fieldErrors).toHaveProperty("firstName");
  });

  it("returns 409 for a duplicate email", async () => {
    await createViaApi({ email: "taken@acme.example" });

    const response = await POST(
      request("POST", await employeePayload({ email: "taken@acme.example" })),
    );

    expect(response.status).toBe(409);
  });
});

describe("GET /api/employees/[id]", () => {
  it("returns 200 with the employee", async () => {
    const { id } = await createViaApi();

    const response = await GET(request("GET"), ctx(id));

    expect(response.status).toBe(200);
    expect((await response.json()).data.id).toBe(id);
  });

  it("returns 404 for an unknown employee", async () => {
    const response = await GET(request("GET"), ctx(424242));
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for a non-numeric id", async () => {
    const response = await GET(request("GET"), ctx("abc"));
    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/employees/[id]", () => {
  it("returns 200 with the updated employee", async () => {
    const { id } = await createViaApi();

    const response = await PATCH(request("PATCH", { salaryMinor: 9_100_000 }), ctx(id));

    expect(response.status).toBe(200);
    expect((await response.json()).data.salary.amountMinor).toBe(9_100_000);
  });

  it("returns 400 when changing country without a salary", async () => {
    const { id } = await createViaApi();

    const response = await PATCH(request("PATCH", { countryCode: "JP" }), ctx(id));

    expect(response.status).toBe(400);
    expect((await response.json()).error.details.fieldErrors).toHaveProperty(
      "salaryMinor",
    );
  });
});

describe("DELETE /api/employees/[id]", () => {
  it("returns 204 and marks the employee terminated", async () => {
    const { id } = await createViaApi();

    const response = await DELETE(request("DELETE"), ctx(id));

    expect(response.status).toBe(204);
    const after = await (await GET(request("GET"), ctx(id))).json();
    expect(after.data.terminatedAt).not.toBeNull();
  });

  it("returns 409 when the employee is already terminated", async () => {
    const { id } = await createViaApi();
    await DELETE(request("DELETE"), ctx(id));

    const response = await DELETE(request("DELETE"), ctx(id));

    expect(response.status).toBe(409);
  });
});
