import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import { handle, parseInput } from "@/lib/http/handle";
import { getSalaryByGroup } from "@/lib/services/insights";
import { insightsByGroupQuerySchema } from "@/lib/validation/insights";

/** Salary stats and headcount per country, department or job title, in USD. */
export const GET = handle(async (request: Request) => {
  await requireSession(request);
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { groupBy, ...filters } = parseInput(insightsByGroupQuerySchema, params);
  return NextResponse.json(await getSalaryByGroup(groupBy, filters));
});
