import { NextResponse } from "next/server";
import { handle, json, parseInput, readJson } from "@/lib/http/handle";
import { listEmployees } from "@/lib/services/employee-directory";
import { createEmployee } from "@/lib/services/employees";
import { createEmployeeSchema } from "@/lib/validation/employee";
import { employeeListQuerySchema } from "@/lib/validation/employee-list";

// TODO(phase-7): replace with the signed-in user's id from requireSession().
const actorId = null;

/** Paginated directory: `{ data: EmployeeListItem[], meta }`. */
export const GET = handle(async (request: Request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = parseInput(employeeListQuerySchema, params);
  return NextResponse.json(await listEmployees(query));
});

export const POST = handle(async (request: Request) => {
  const input = parseInput(createEmployeeSchema, await readJson(request));
  const employee = await createEmployee(input, { actorId });
  return json(employee, 201);
});
