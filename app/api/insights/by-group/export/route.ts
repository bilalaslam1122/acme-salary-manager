import { requireSession } from "@/lib/auth/require-session";
import { csvResponse } from "@/lib/http/csv-response";
import { handle, parseInput } from "@/lib/http/handle";
import { exportSalaryByGroupCsv } from "@/lib/services/exports";
import { insightsByGroupQuerySchema } from "@/lib/validation/insights";

/** The insights group table as CSV: same query string as GET /api/insights/by-group. */
export const GET = handle(async (request: Request) => {
  await requireSession(request);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { groupBy, ...filters } = parseInput(insightsByGroupQuerySchema, params);
  return csvResponse(await exportSalaryByGroupCsv(groupBy, filters));
});
