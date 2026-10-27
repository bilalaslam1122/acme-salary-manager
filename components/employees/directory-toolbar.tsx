"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import type { ReferenceData } from "@/lib/services/reference";
import { directoryHref } from "@/lib/validation/directory-url";
import type { EmployeeListQuery } from "@/lib/validation/employee-list";

export const SEARCH_DEBOUNCE_MS = 300;

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

      <div className="flex h-9 items-center gap-2">
        <Switch
          id="filter-terminated"
          checked={query.includeTerminated}
          onCheckedChange={(checked) => navigate({ includeTerminated: checked })}
        />
        <Label htmlFor="filter-terminated" className="text-sm font-normal">
          Show terminated
        </Label>
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

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value="">All</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
