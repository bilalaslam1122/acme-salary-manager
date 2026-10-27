import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { handle, parseInput } from "@/lib/http/handle";
import { listSalaryHistory } from "@/lib/services/salary-history";
import { employeeIdSchema } from "@/lib/validation/employee";
import { paginationSchema } from "@/lib/validation/pagination";

/** An employee's salary changes, newest first: `{ data, meta }`. */
export const GET = handle(
  async (request: Request, ctx: RouteContext<"/api/employees/[id]/history">) => {
    await requireSession(request);
    const id = parseInput(employeeIdSchema, (await ctx.params).id);
    const params = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(
      await listSalaryHistory(id, parseInput(paginationSchema, params)),
    );
  },
);
