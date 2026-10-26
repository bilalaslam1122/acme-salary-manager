import { handle, json, noContent, parseInput, readJson } from "@/lib/http/handle";
import { getEmployee, terminateEmployee, updateEmployee } from "@/lib/services/employees";
import { employeeIdSchema, updateEmployeeSchema } from "@/lib/validation/employee";

type Context = RouteContext<"/api/employees/[id]">;

// TODO(phase-7): replace with the signed-in user's id from requireSession().
const actorId = null;

async function parseId(ctx: Context): Promise<number> {
  const { id } = await ctx.params;
  return parseInput(employeeIdSchema, id);
}

export const GET = handle(async (_request: Request, ctx: Context) => {
  return json(await getEmployee(await parseId(ctx)));
});

export const PATCH = handle(async (request: Request, ctx: Context) => {
  const id = await parseId(ctx);
  const input = parseInput(updateEmployeeSchema, await readJson(request));
  return json(await updateEmployee(id, input, { actorId }));
});

/** Terminates (soft-deletes) the employee; see architecture.md Invariant 10. */
export const DELETE = handle(async (_request: Request, ctx: Context) => {
  await terminateEmployee(await parseId(ctx));
  return noContent();
});
