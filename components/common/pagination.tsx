import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { pageItems, pageRange } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { JumpToPage, PAGE_TOKEN, PageSizeSelect } from "./pagination-controls";

const count = new Intl.NumberFormat("en-US");

/** "Go to page" appears once paging by numbers gets tedious. */
const JUMP_THRESHOLD = 7;

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Canonical URL for a page; every control is a real link (works without JS). */
  hrefForPage: (page: number) => string;
  itemLabel: { singular: string; plural: string };
  /** Accessible name for the page navigation. */
  label: string;
  /** Show a rows-per-page select with these sizes (each a URL resetting to page 1). */
  pageSizeOptions?: { size: number; href: string }[];
}

/**
 * Results summary + numbered page navigation:
 * « ‹ 1 … 6 [7] 8 … 200 › » with first/last, a constant-width number strip,
 * rows per page, and "Go to page" for long lists. On small screens the number
 * strip collapses to "Page 7 of 200".
 */
export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  hrefForPage,
  itemLabel,
  label,
  pageSizeOptions,
}: PaginationProps) {
  if (total === 0) return null;

  const { first, last, inRange } = pageRange(page, pageSize, total);
  const noun = total === 1 ? itemLabel.singular : itemLabel.plural;
  const hasPrevious = page > 1 && inRange;
  const hasNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {inRange ? (
          <p className="text-muted-foreground" aria-live="polite">
            Showing{" "}
            <span className="font-medium text-foreground tabular-nums">
              {count.format(first)}–{count.format(last)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground tabular-nums">
              {count.format(total)}
            </span>{" "}
            {noun}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Page {count.format(page)} doesn&apos;t exist.{" "}
            <Link
              href={hrefForPage(totalPages)}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Go to the last page
            </Link>
          </p>
        )}
        {pageSizeOptions && (
          <PageSizeSelect current={pageSize} options={pageSizeOptions} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {totalPages > JUMP_THRESHOLD && (
            <div className="hidden lg:block">
              <JumpToPage
                current={page}
                totalPages={totalPages}
                firstPageHref={hrefForPage(1)}
                hrefTemplate={hrefForPage(PAGE_TOKEN)}
              />
            </div>
          )}
          <nav aria-label={label} className="flex items-center gap-1">
            <StepLink
              href={hrefForPage(1)}
              enabled={hasPrevious}
              label="First page"
              className="hidden sm:inline-flex"
            >
              <ChevronsLeft aria-hidden />
            </StepLink>
            <StepLink
              href={hrefForPage(page - 1)}
              enabled={hasPrevious}
              label="Previous page"
            >
              <ChevronLeft aria-hidden />
            </StepLink>

            <ol className="hidden items-center gap-1 sm:flex">
              {pageItems(page, totalPages).map((item) =>
                typeof item === "number" ? (
                  <li key={item}>
                    <Button
                      asChild
                      variant={item === page ? "default" : "ghost"}
                      size="sm"
                      className="min-w-8 justify-center tabular-nums"
                    >
                      <Link
                        href={hrefForPage(item)}
                        aria-label={`Page ${item}`}
                        aria-current={item === page ? "page" : undefined}
                      >
                        {count.format(item)}
                      </Link>
                    </Button>
                  </li>
                ) : (
                  <li
                    key={item}
                    aria-hidden
                    className="min-w-8 text-center text-muted-foreground select-none"
                  >
                    …
                  </li>
                ),
              )}
            </ol>
            <span className="px-2 text-muted-foreground tabular-nums sm:hidden">
              Page {count.format(page)} of {count.format(totalPages)}
            </span>

            <StepLink href={hrefForPage(page + 1)} enabled={hasNext} label="Next page">
              <ChevronRight aria-hidden />
            </StepLink>
            <StepLink
              href={hrefForPage(totalPages)}
              enabled={hasNext}
              label="Last page"
              className="hidden sm:inline-flex"
            >
              <ChevronsRight aria-hidden />
            </StepLink>
          </nav>
        </div>
      )}
    </div>
  );
}

function StepLink({
  href,
  enabled,
  label,
  className,
  children,
}: {
  href: string;
  enabled: boolean;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  if (!enabled) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        disabled
        aria-label={label}
        className={className}
      >
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="icon-sm" className={cn(className)}>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
