import { requireSession } from "@/lib/auth/require-session";
import { handle, json, parseInput } from "@/lib/http/handle";
import { listEmployeeEvents } from "@/lib/services/employee-events";
import { employeeIdSchema } from "@/lib/validation/employee";

/** An employee's non-salary changes (edits, termination, reinstatement), newest first. */
export const GET = handle(
  async (request: Request, ctx: RouteContext<"/api/employees/[id]/events">) => {
    await requireSession(request);
    const id = parseInput(employeeIdSchema, (await ctx.params).id);
    return json(await listEmployeeEvents(id));
  },
);
