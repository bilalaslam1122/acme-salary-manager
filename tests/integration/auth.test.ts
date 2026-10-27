import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as getHistory } from "@/app/api/employees/[id]/history/route";
import { GET as getEvents } from "@/app/api/employees/[id]/events/route";
import { GET as exportEmployees } from "@/app/api/employees/export/route";
import { GET as exportByGroup } from "@/app/api/insights/by-group/export/route";
import { POST as reinstateEmployee } from "@/app/api/employees/[id]/reinstate/route";
import {
  GET as getEmployee,
  PATCH as patchEmployee,
} from "@/app/api/employees/[id]/route";
import { POST as terminateEmployee } from "@/app/api/employees/[id]/terminate/route";
import { GET as listEmployees, POST as createEmployee } from "@/app/api/employees/route";
import { GET as getByGroup } from "@/app/api/insights/by-group/route";
import { GET as getDistribution } from "@/app/api/insights/distribution/route";
import { GET as getSummary } from "@/app/api/insights/summary/route";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { POST as demoLogin } from "@/app/api/auth/demo/route";
import { DEMO_USER } from "@/lib/auth/demo";
import { upsertAdminUser, upsertDemoUser } from "@/prisma/seed/admin";
import { authed, signIn } from "./auth";
import { testPrisma } from "./db";
import { employeePayload, seedReferenceData } from "./factories";

const admin = {
  SEED_ADMIN_EMAIL: "hr@acme.example",
  SEED_ADMIN_PASSWORD: "correct-horse-battery",
  SEED_ADMIN_NAME: "HR Manager",
};

function loginRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sessionCookieFrom(response: Response): string | undefined {
  const header = response.headers.get("set-cookie") ?? "";
  return header.startsWith(`${SESSION_COOKIE}=`) ? header : undefined;
}

beforeEach(async () => {
  await seedReferenceData();
});

describe("upsertAdminUser", () => {
  it("creates the HR Manager with a bcrypt hash, never the plain password", async () => {
    await upsertAdminUser(testPrisma, admin);

    const user = await testPrisma.user.findUniqueOrThrow({
      where: { email: admin.SEED_ADMIN_EMAIL },
    });
    expect(user.passwordHash).not.toContain(admin.SEED_ADMIN_PASSWORD);
    expect(await verifyPassword(admin.SEED_ADMIN_PASSWORD, user.passwordHash)).toBe(true);
  });

  it("updates the password on re-run instead of duplicating the user", async () => {
    await upsertAdminUser(testPrisma, admin);
    await upsertAdminUser(testPrisma, {
      ...admin,
      SEED_ADMIN_PASSWORD: "a-brand-new-password",
    });

    const users = await testPrisma.user.findMany();
    expect(users).toHaveLength(1);
    expect(await verifyPassword("a-brand-new-password", users[0]!.passwordHash)).toBe(
      true,
    );
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await upsertAdminUser(testPrisma, admin);
  });

  it("sets an HttpOnly session cookie and returns the user", async () => {
    const response = await login(
      loginRequest({ email: "HR@acme.example", password: admin.SEED_ADMIN_PASSWORD }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).data.user).toMatchObject({
      email: "hr@acme.example",
      name: "HR Manager",
    });
    const cookie = sessionCookieFrom(response);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    const token = cookie!.split(";")[0]!.slice(SESSION_COOKIE.length + 1);
    expect(await verifySessionToken(token)).toMatchObject({ email: "hr@acme.example" });
  });

  it("returns the same 401 for a wrong password and an unknown email", async () => {
    const wrongPassword = await login(
      loginRequest({ email: admin.SEED_ADMIN_EMAIL, password: "not-the-password" }),
    );
    const unknownEmail = await login(
      loginRequest({ email: "nobody@acme.example", password: "not-the-password" }),
    );

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
    expect(sessionCookieFrom(wrongPassword)).toBeUndefined();
  });

  it("returns 400 for a malformed body", async () => {
    const response = await login(loginRequest({ email: "not-an-email" }));
    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/demo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 404 and sets no cookie unless DEMO_LOGIN=true", async () => {
    await upsertDemoUser(testPrisma);

    const response = await demoLogin();

    expect(response.status).toBe(404);
    expect(sessionCookieFrom(response)).toBeUndefined();
  });

  it("signs in as the demo account when enabled", async () => {
    vi.stubEnv("DEMO_LOGIN", "true");
    await upsertDemoUser(testPrisma);

    const response = await demoLogin();

    expect(response.status).toBe(200);
    expect((await response.json()).data.user).toMatchObject({
      email: DEMO_USER.email,
      name: DEMO_USER.name,
    });
    const cookie = sessionCookieFrom(response)!;
    const token = cookie.split(";")[0]!.slice(`${SESSION_COOKIE}=`.length);
    expect((await verifySessionToken(token))?.email).toBe(DEMO_USER.email);
  });

  it("returns 404 when enabled but the demo account was never seeded", async () => {
    vi.stubEnv("DEMO_LOGIN", "true");
    expect((await demoLogin()).status).toBe(404);
  });

  it("gives the demo account a password nobody knows", async () => {
    await upsertDemoUser(testPrisma);

    const response = await login(loginRequest({ email: DEMO_USER.email, password: "" }));
    const guess = await login(
      loginRequest({ email: DEMO_USER.email, password: "demo-password-guess" }),
    );

    expect(response.status).toBe(400);
    expect(guess.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("expires the session cookie", async () => {
    const response = await logout();

    expect(response.status).toBe(204);
    expect(sessionCookieFrom(response)).toMatch(/Max-Age=0/i);
  });
});

describe("protected API routes (Invariant 9)", () => {
  const ctx = { params: Promise.resolve({ id: "1" }) };
  const anonymous = (method = "GET") =>
    new Request("http://localhost/api/x", {
      method,
      headers: { "content-type": "application/json" },
      body: method === "GET" ? undefined : "{}",
    });

  const routes: [string, () => Promise<Response>][] = [
    ["GET /api/employees", () => listEmployees(anonymous())],
    ["POST /api/employees", () => createEmployee(anonymous("POST"))],
    ["GET /api/employees/[id]", () => getEmployee(anonymous(), ctx)],
    ["PATCH /api/employees/[id]", () => patchEmployee(anonymous("PATCH"), ctx)],
    [
      "POST /api/employees/[id]/terminate",
      () => terminateEmployee(anonymous("POST"), ctx),
    ],
    [
      "POST /api/employees/[id]/reinstate",
      () => reinstateEmployee(anonymous("POST"), ctx),
    ],
    ["GET /api/employees/[id]/events", () => getEvents(anonymous(), ctx)],
    ["GET /api/employees/[id]/history", () => getHistory(anonymous(), ctx)],
    ["GET /api/employees/export", () => exportEmployees(anonymous())],
    ["GET /api/insights/by-group/export", () => exportByGroup(anonymous())],
    ["GET /api/insights/summary", () => getSummary(anonymous())],
    ["GET /api/insights/by-group", () => getByGroup(anonymous())],
    ["GET /api/insights/distribution", () => getDistribution(anonymous())],
  ];

  it.each(routes)("%s returns 401 without a session", async (_name, call) => {
    const response = await call();
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHORIZED");
  });
});

describe("audit trail attribution", () => {
  it("records the signed-in user on salary changes made through the API", async () => {
    const { userId } = await signIn();
    const created = await createEmployee(
      authed("http://localhost/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(await employeePayload()),
      }),
    );
    const { id } = (await created.json()).data;

    await patchEmployee(
      authed(`http://localhost/api/employees/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ salaryMinor: 9_000_000 }),
      }),
      { params: Promise.resolve({ id: String(id) }) },
    );

    const history = await testPrisma.salaryHistory.findMany({
      where: { employeeId: id },
    });
    expect(history).toHaveLength(2);
    expect(history.every((row) => row.changedById === userId)).toBe(true);
  });
});
