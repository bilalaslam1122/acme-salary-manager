import { NextResponse } from "next/server";
import { handle, parseInput } from "@/lib/http/handle";
import { getSalaryByGroup } from "@/lib/services/insights";
import { insightsByGroupQuerySchema } from "@/lib/validation/insights";

/** Salary stats and headcount per country, department or job title, in USD. */
export const GET = handle(async (request: Request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const { groupBy, ...filters } = parseInput(insightsByGroupQuerySchema, params);
  return NextResponse.json(await getSalaryByGroup(groupBy, filters));
});
