import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/lib/services/employee-directory";
import { directoryHref } from "@/lib/validation/directory-url";
import type { EmployeeListQuery } from "@/lib/validation/employee-list";

const numberFormat = new Intl.NumberFormat("en-US");

export function DirectoryPagination({
  query,
  meta,
}: {
  query: EmployeeListQuery;
  meta: PageMeta;
}) {
  if (meta.total === 0) return null;
  const first = (meta.page - 1) * meta.pageSize + 1;
  const last = Math.min(meta.page * meta.pageSize, meta.total);
  const hasPrevious = meta.page > 1;
  const hasNext = meta.page < meta.totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm"
    >
      <p className="text-muted-foreground tabular-nums">
        {first <= meta.total
          ? `Showing ${numberFormat.format(first)}–${numberFormat.format(last)} of ${numberFormat.format(meta.total)}`
          : `No results on page ${meta.page} of ${meta.totalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <PageLink
          href={directoryHref(query, { page: meta.page - 1 })}
          disabled={!hasPrevious}
          label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </PageLink>
        <span className="text-muted-foreground tabular-nums">
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </span>
        <PageLink
          href={directoryHref(query, { page: meta.page + 1 })}
          disabled={!hasNext}
          label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="icon">
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
