export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Page numbers to show, e.g. page 7 of 200 → [1, "ellipsis-start", 6, 7, 8,
 * "ellipsis-end", 200]. Always the first and last page, `siblings` either side of the
 * current page, and ellipses only where they hide two or more pages (never "1 … 3").
 * The item count stays constant (2·siblings + 5) once there are enough pages, so the
 * control doesn't change width while paging.
 */
export function pageItems(current: number, totalPages: number, siblings = 1): PageItem[] {
  if (totalPages <= 0) return [];
  const slots = 2 * siblings + 5;
  if (totalPages <= slots) return range(1, totalPages);

  const page = Math.min(Math.max(current, 1), totalPages);
  const start = Math.max(Math.min(page - siblings, totalPages - 2 * siblings - 2), 3);
  const end = Math.min(Math.max(page + siblings, 2 * siblings + 3), totalPages - 2);

  return [
    1,
    start > 3 ? "ellipsis-start" : 2,
    ...range(start, end),
    end < totalPages - 2 ? "ellipsis-end" : totalPages - 1,
    totalPages,
  ];
}

/** 1-based index of the first and last item on a page, e.g. page 7 of 50 → 301–350. */
export function pageRange(page: number, pageSize: number, total: number) {
  const first = (page - 1) * pageSize + 1;
  return { first, last: Math.min(page * pageSize, total), inRange: first <= total };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);
}
