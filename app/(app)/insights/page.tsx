import { ChartColumn, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { GroupTabs } from "@/components/insights/group-tabs";
import { HistogramChart } from "@/components/insights/histogram-chart";
import { HorizontalBarChart } from "@/components/insights/horizontal-bar-chart";
import { InsightsFilters } from "@/components/insights/insights-filters";
import { InsightsSkeleton } from "@/components/insights/insights-skeleton";
import {
  GroupStatsTable,
  HeadcountTable,
  HistogramTable,
  TableView,
} from "@/components/insights/insights-tables";
import { StatTiles } from "@/components/insights/stat-tiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { headcountRows, histogramRows, medianRows } from "@/lib/insights/chart-data";
import {
  getSalaryByGroup,
  getSalaryDistribution,
  getSalarySummary,
} from "@/lib/services/insights";
import { getReferenceData } from "@/lib/services/reference";
import type { InsightGroup } from "@/lib/validation/insights";
import {
  filtersOf,
  hasFilters,
  insightsHref,
  parseInsightsQuery,
} from "@/lib/validation/insights-url";

export const metadata: Metadata = { title: "Insights · ACME Salary Manager" };

const GROUP_LABEL: Record<InsightGroup, string> = {
  country: "Country",
  department: "Department",
  jobTitle: "Job title",
};

export default function InsightsPage({ searchParams }: PageProps<"/insights">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Insights</h1>
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function InsightsContent({
  searchParams,
}: {
  searchParams: PageProps<"/insights">["searchParams"];
}) {
  const query = parseInsightsQuery(await searchParams);
  const filters = filtersOf(query);
  // All aggregation happens in SQL (Invariant 2); five small queries in parallel.
  const [summary, byGroup, byCountry, distribution, reference] = await Promise.all([
    getSalarySummary(filters),
    getSalaryByGroup(query.groupBy, filters),
    getSalaryByGroup("country", filters),
    getSalaryDistribution(filters),
    getReferenceData(),
  ]);
  const fx = summary.meta.fx;
  const histogram = histogramRows(distribution.data.buckets);

  return (
    <div className="flex flex-col gap-4">
      <InsightsFilters query={query} reference={reference} />

      {summary.data.headcount === 0 ? (
        <Card className="rounded-lg">
          {hasFilters(query) ? (
            <EmptyState
              icon={SearchX}
              title="No active employees match these filters."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href={insightsHref({ groupBy: query.groupBy })}>
                    Clear filters
                  </Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={ChartColumn}
              title="No active employees yet. Insights appear once employees are added."
            />
          )}
        </Card>
      ) : (
        <>
          <StatTiles stats={summary.data} />

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={`Median salary by ${GROUP_LABEL[query.groupBy].toLowerCase()} (USD)`}
              action={<GroupTabs query={query} />}
            >
              <div className="px-4 pb-4">
                <HorizontalBarChart
                  rows={medianRows(byGroup.data)}
                  measure="medianUsd"
                  label={`Median salary by ${GROUP_LABEL[query.groupBy]}`}
                  categoryWidth={query.groupBy === "jobTitle" ? 200 : 128}
                />
              </div>
              <div className="border-t">
                <GroupStatsTable
                  groups={byGroup.data}
                  groupLabel={GROUP_LABEL[query.groupBy]}
                />
              </div>
            </ChartCard>

            <ChartCard title="Headcount by country">
              <div className="px-4 pb-4">
                <HorizontalBarChart
                  rows={headcountRows(byCountry.data)}
                  measure="headcount"
                  label="Headcount by country"
                />
              </div>
              <TableView>
                <HeadcountTable groups={byCountry.data} />
              </TableView>
            </ChartCard>
          </div>

          <ChartCard title="Salary distribution (USD)">
            <div className="px-4 pb-4">
              <HistogramChart rows={histogram} />
            </div>
            <TableView>
              <HistogramTable rows={histogram} />
            </TableView>
          </ChartCard>
        </>
      )}

      {fx && (
        <p className="text-xs text-muted-foreground">
          Active employees only. USD at FX version {fx.version} ({fx.effectiveDate}).
        </p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-lg pb-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  );
}
