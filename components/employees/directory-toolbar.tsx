"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FilterSelect } from "@/components/common/filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReferenceData } from "@/lib/services/reference";
import { directoryHref, statusHref } from "@/lib/validation/directory-url";
import {
  EMPLOYEE_STATUSES,
  type EmployeeListQuery,
  type EmployeeStatus,
} from "@/lib/validation/employee-list";

export const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  terminated: "Terminated",
  all: "All",
};

interface DirectoryToolbarProps {
  query: EmployeeListQuery;
  reference: ReferenceData;
}

/** Search and filters live in the URL so views are linkable and Back works. */
export function DirectoryToolbar({ query, reference }: DirectoryToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const urlSearch = query.q ?? "";
  const [search, setSearch] = useState(urlSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);

  // Follow the URL when it changes from outside (Back button, "Clear filters").
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  function navigate(overrides: Partial<EmployeeListQuery>) {
    startTransition(() => {
      router.push(directoryHref(query, { ...overrides, page: 1 }));
    });
  }

  useEffect(() => {
    if (search.trim() === urlSearch) return;
    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(directoryHref(query, { q: search.trim() || undefined, page: 1 }));
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, urlSearch, query, router]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-56 flex-1">
        <Label htmlFor="directory-search" className="sr-only">
          Search employees
        </Label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="directory-search"
          type="search"
          placeholder="Search name, email or code"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <FilterSelect
        id="filter-country"
        label="Country"
        value={query.countryCode ?? ""}
        onChange={(value) => navigate({ countryCode: value || undefined })}
        options={reference.countries.map((c) => ({ value: c.code, label: c.name }))}
      />
      <FilterSelect
        id="filter-department"
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
        id="filter-title"
        label="Job title"
        value={query.jobTitle ?? ""}
        onChange={(value) => navigate({ jobTitle: value || undefined })}
        options={reference.jobTitles.map((t) => ({ value: t, label: t }))}
      />

      <div className="flex flex-col gap-1">
        <span id="filter-status-label" className="text-xs text-muted-foreground">
          Status
        </span>
        <div
          role="group"
          aria-labelledby="filter-status-label"
          className="inline-flex h-9 items-center rounded-md border bg-muted/40 p-0.5"
        >
          {EMPLOYEE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={query.status === status}
              onClick={() =>
                startTransition(() => router.push(statusHref(query, status)))
              }
              className="h-full rounded-[5px] px-3 text-sm text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-background aria-pressed:font-medium aria-pressed:text-foreground aria-pressed:shadow-xs"
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <LoaderCircle
          className="h-4 w-4 animate-spin self-center text-muted-foreground"
          aria-label="Updating results"
        />
      )}
    </div>
  );
}
