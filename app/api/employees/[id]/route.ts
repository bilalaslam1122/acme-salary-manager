import { requireSession } from "@/lib/auth/require-session";
import { handle, json, parseInput, readJson } from "@/lib/http/handle";
import { getEmployee, updateEmployee } from "@/lib/services/employees";
import { employeeIdSchema, updateEmployeeSchema } from "@/lib/validation/employee";

type Context = RouteContext<"/api/employees/[id]">;

async function parseId(ctx: Context): Promise<number> {
  const { id } = await ctx.params;
  return parseInput(employeeIdSchema, id);
}

export const GET = handle(async (request: Request, ctx: Context) => {
  await requireSession(request);
  return json(await getEmployee(await parseId(ctx)));
});

export const PATCH = handle(async (request: Request, ctx: Context) => {
  const { userId } = await requireSession(request);
  const id = await parseId(ctx);
  const input = parseInput(updateEmployeeSchema, await readJson(request));
  return json(await updateEmployee(id, input, { actorId: userId }));
});
