import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InsightGroup } from "@/lib/validation/insights";
import { insightsHref, type InsightsPageQuery } from "@/lib/validation/insights-url";

const GROUP_LABELS: Record<InsightGroup, string> = {
  country: "Country",
  department: "Department",
  jobTitle: "Job title",
};

/** Segmented links for the "Salary by…" view; state lives in the URL like the filters. */
export function GroupTabs({ query }: { query: InsightsPageQuery }) {
  return (
    <nav aria-label="Group salaries by" className="inline-flex rounded-md bg-muted p-1">
      {(Object.keys(GROUP_LABELS) as InsightGroup[]).map((group) => {
        const active = query.groupBy === group;
        return (
          <Link
            key={group}
            href={insightsHref(query, { groupBy: group })}
            aria-current={active ? "page" : undefined}
            scroll={false}
            className={cn(
              "rounded-sm px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {GROUP_LABELS[group]}
          </Link>
        );
      })}
    </nav>
  );
}
