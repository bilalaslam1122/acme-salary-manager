import { beforeEach, describe, expect, it } from "vitest";
import { GET as getEvents } from "@/app/api/employees/[id]/events/route";
import { POST as reinstate } from "@/app/api/employees/[id]/reinstate/route";
import { GET, PATCH } from "@/app/api/employees/[id]/route";
import { POST as terminate } from "@/app/api/employees/[id]/terminate/route";
import { POST } from "@/app/api/employees/route";
import { authed, signIn } from "./auth";
import { employeePayload, seedReferenceData } from "./factories";

function request(method: string, body?: unknown): Request {
  return authed("http://localhost/api/employees", {
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
  await signIn();
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

describe("POST /api/employees/[id]/terminate and /reinstate", () => {
  const resigned = { reason: "Resigned" };

  it("terminates with a reason, then reinstates", async () => {
    const { id } = await createViaApi();

    const terminated = await terminate(request("POST", resigned), ctx(id));
    expect(terminated.status).toBe(204);
    expect(
      (await (await GET(request("GET"), ctx(id))).json()).data.terminatedAt,
    ).not.toBeNull();

    const reinstated = await reinstate(request("POST", { reason: "Mistake" }), ctx(id));
    expect(reinstated.status).toBe(204);
    expect(
      (await (await GET(request("GET"), ctx(id))).json()).data.terminatedAt,
    ).toBeNull();
  });

  it("returns 400 without a reason", async () => {
    const { id } = await createViaApi();

    const response = await terminate(request("POST", { reason: "  " }), ctx(id));

    expect(response.status).toBe(400);
    expect((await response.json()).error.details.fieldErrors).toHaveProperty("reason");
  });

  it("returns 409 when the employee is already terminated", async () => {
    const { id } = await createViaApi();
    await terminate(request("POST", resigned), ctx(id));

    const response = await terminate(request("POST", resigned), ctx(id));

    expect(response.status).toBe(409);
  });

  it("returns 409 when reinstating an active employee", async () => {
    const { id } = await createViaApi();

    const response = await reinstate(request("POST", { reason: "Mistake" }), ctx(id));

    expect(response.status).toBe(409);
  });

  it("lists the audit events newest first, attributed to the signed-in user", async () => {
    const { id } = await createViaApi();
    await PATCH(request("PATCH", { jobTitle: "Staff Engineer" }), ctx(id));
    await terminate(request("POST", resigned), ctx(id));

    const response = await getEvents(request("GET"), ctx(id));

    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.map((e: { type: string }) => e.type)).toEqual(["TERMINATED", "UPDATED"]);
    expect(data[0]).toMatchObject({ reason: "Resigned", changedBy: { name: "Test HR" } });
    expect(data[1].changes).toEqual({
      "Job title": { from: "Software Engineer", to: "Staff Engineer" },
    });
  });

  it("returns 404 for the events of an unknown employee", async () => {
    expect((await getEvents(request("GET"), ctx(99_999))).status).toBe(404);
  });
});
