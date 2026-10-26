import { z } from "zod";
import { employeeFiltersSchema, employeeFiltersShape } from "./employee-filters";

export const INSIGHT_GROUPS = ["country", "department", "jobTitle"] as const;
export type InsightGroup = (typeof INSIGHT_GROUPS)[number];

/** Query string for /api/insights/summary and /api/insights/distribution. */
export const insightsQuerySchema = employeeFiltersSchema;

/** Query string for /api/insights/by-group. */
export const insightsByGroupQuerySchema = z.object({
  groupBy: z.enum(INSIGHT_GROUPS),
  ...employeeFiltersShape,
});

export type InsightsByGroupQuery = z.infer<typeof insightsByGroupQuerySchema>;
