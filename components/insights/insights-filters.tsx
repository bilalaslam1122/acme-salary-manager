"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FilterSelect } from "@/components/common/filter-select";
import { Button } from "@/components/ui/button";
import type { ReferenceData } from "@/lib/services/reference";
import {
  hasFilters,
  insightsHref,
  type InsightsPageQuery,
} from "@/lib/validation/insights-url";

/**
 * The one filter row above every chart; all stats and charts re-render against the
 * same slice. Navigation runs in a transition so the previous render stays on screen
 * (no skeleton flash) while the new slice loads.
 */
export function InsightsFilters({
  query,
  reference,
}: {
  query: InsightsPageQuery;
  reference: ReferenceData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(overrides: Partial<InsightsPageQuery>) {
    startTransition(() => router.push(insightsHref(query, overrides)));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterSelect
        id="insights-country"
        label="Country"
        value={query.countryCode ?? ""}
        onChange={(value) => navigate({ countryCode: value || undefined })}
        options={reference.countries.map((c) => ({ value: c.code, label: c.name }))}
      />
      <FilterSelect
        id="insights-department"
        label="Department"
        value={query.departmentId ? String(query.departmentId) : ""}
        onChange={(value) =>
          navigate({ departmentId: value ? Number(value) : undefined })
        }
        options={reference.departments.map((d) => ({
          value: String(d.id),
          label: d.name,
        }))}
      />
      <FilterSelect
        id="insights-title"
        label="Job title"
        value={query.jobTitle ?? ""}
        onChange={(value) => navigate({ jobTitle: value || undefined })}
        options={reference.jobTitles.map((t) => ({ value: t, label: t }))}
      />
      {hasFilters(query) && (
        <Button asChild variant="ghost" size="sm" className="mb-0.5">
          <Link href={insightsHref({ groupBy: query.groupBy })}>Clear filters</Link>
        </Button>
      )}
      {isPending && (
        <LoaderCircle
          className="mb-2 h-4 w-4 animate-spin text-muted-foreground"
          aria-label="Updating insights"
        />
      )}
    </div>
  );
}
