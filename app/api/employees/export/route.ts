import { requireSession } from "@/lib/auth/require-session";
import { csvResponse } from "@/lib/http/csv-response";
import { handle, parseInput } from "@/lib/http/handle";
import { exportEmployeesCsv } from "@/lib/services/exports";
import { employeeListQuerySchema } from "@/lib/validation/employee-list";

/** The directory as CSV: same query string as GET /api/employees, every page. */
export const GET = handle(async (request: Request) => {
  await requireSession(request);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return csvResponse(
    await exportEmployeesCsv(parseInput(employeeListQuerySchema, params)),
  );
});
