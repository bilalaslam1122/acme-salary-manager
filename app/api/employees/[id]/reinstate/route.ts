import { requireSession } from "@/lib/auth/require-session";
import { handle, noContent, parseInput, readJson } from "@/lib/http/handle";
import { reinstateEmployee } from "@/lib/services/employees";
import { employeeIdSchema, employmentChangeSchema } from "@/lib/validation/employee";

/** Makes a terminated employee active again, with a reason. */
export const POST = handle(
  async (request: Request, ctx: RouteContext<"/api/employees/[id]/reinstate">) => {
    const { userId } = await requireSession(request);
    const id = parseInput(employeeIdSchema, (await ctx.params).id);
    const input = parseInput(employmentChangeSchema, await readJson(request));
    await reinstateEmployee(id, input, { actorId: userId });
    return noContent();
  },
);
