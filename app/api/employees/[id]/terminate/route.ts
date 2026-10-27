import { requireSession } from "@/lib/auth/require-session";
import { handle, noContent, parseInput, readJson } from "@/lib/http/handle";
import { terminateEmployee } from "@/lib/services/employees";
import { employeeIdSchema, employmentChangeSchema } from "@/lib/validation/employee";

/** Terminates (soft-deletes) the employee with a reason; see architecture.md Invariant 10. */
export const POST = handle(
  async (request: Request, ctx: RouteContext<"/api/employees/[id]/terminate">) => {
    const { userId } = await requireSession(request);
    const id = parseInput(employeeIdSchema, (await ctx.params).id);
    const input = parseInput(employmentChangeSchema, await readJson(request));
    await terminateEmployee(id, input, { actorId: userId });
    return noContent();
  },
);
