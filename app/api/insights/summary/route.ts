import { NextResponse } from "next/server";
import { handle, parseInput } from "@/lib/http/handle";
import { getSalarySummary } from "@/lib/services/insights";
import { insightsQuerySchema } from "@/lib/validation/insights";

/** Headcount and min/max/avg/median salary in USD for the filtered employees. */
export const GET = handle(async (request: Request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return NextResponse.json(
    await getSalarySummary(parseInput(insightsQuerySchema, params)),
  );
});
