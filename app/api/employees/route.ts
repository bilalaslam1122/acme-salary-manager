import { handle, json, parseInput, readJson } from "@/lib/http/handle";
import { createEmployee } from "@/lib/services/employees";
import { createEmployeeSchema } from "@/lib/validation/employee";

// TODO(phase-7): replace with the signed-in user's id from requireSession().
const actorId = null;

export const POST = handle(async (request: Request) => {
  const input = parseInput(createEmployeeSchema, await readJson(request));
  const employee = await createEmployee(input, { actorId });
  return json(employee, 201);
});
