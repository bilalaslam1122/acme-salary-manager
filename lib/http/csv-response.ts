import type { CsvFile } from "@/lib/services/exports";

/** A CSV download. `no-store`: exports contain salaries and must not be cached. */
export function csvResponse({ filename, content }: CsvFile): Response {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
