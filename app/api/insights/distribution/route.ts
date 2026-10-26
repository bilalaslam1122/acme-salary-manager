import { NextResponse } from "next/server";
import { handle, parseInput } from "@/lib/http/handle";
import { getSalaryDistribution } from "@/lib/services/insights";
import { insightsQuerySchema } from "@/lib/validation/insights";

/** Salary distribution histogram in USD for the filtered employees. */
export const GET = handle(async (request: Request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return NextResponse.json(
    await getSalaryDistribution(parseInput(insightsQuerySchema, params)),
  );
});
