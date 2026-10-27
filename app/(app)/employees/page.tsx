import type { Metadata } from "next";
import { Suspense } from "react";
import { Pagination } from "@/components/common/pagination";
import { DirectorySkeleton } from "@/components/employees/directory-skeleton";
import { DirectoryTable } from "@/components/employees/directory-table";
import { DirectoryToolbar } from "@/components/employees/directory-toolbar";
import { EmployeeSheet } from "@/components/employees/employee-sheet";
import { Card } from "@/components/ui/card";
import { listEmployees } from "@/lib/services/employee-directory";
import { getReferenceData } from "@/lib/services/reference";
import { directoryHref, parseDirectoryQuery } from "@/lib/validation/directory-url";

export const metadata: Metadata = { title: "Employees · ACME Salary Manager" };

const countFormat = new Intl.NumberFormat("en-US");
const PAGE_SIZES = [25, 50, 100];

export default function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Employees</h1>
      {/* searchParams and the DB read are request-time data: stream them (Cache Components). */}
      <Suspense fallback={<DirectorySkeleton />}>
        <Directory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Directory({
  searchParams,
}: {
  searchParams: PageProps<"/employees">["searchParams"];
}) {
  const query = parseDirectoryQuery(await searchParams);
  // Server components call services directly (AD-10); proxy.ts has checked the session.
  const [result, reference] = await Promise.all([
    listEmployees(query),
    getReferenceData(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <DirectoryToolbar query={query} reference={reference} />
        <EmployeeSheet reference={reference} />
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {countFormat.format(result.meta.total)}{" "}
        {result.meta.total === 1 ? "employee" : "employees"}
        {result.meta.fxVersion && ` · USD at FX ${result.meta.fxVersion}`}
      </p>
      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <DirectoryTable rows={result.data} query={query} />
        <Pagination
          page={result.meta.page}
          pageSize={result.meta.pageSize}
          total={result.meta.total}
          totalPages={result.meta.totalPages}
          hrefForPage={(page) => directoryHref(query, { page })}
          itemLabel={{ singular: "employee", plural: "employees" }}
          label="Employee pages"
          pageSizeOptions={PAGE_SIZES.map((size) => ({
            size,
            href: directoryHref(query, { pageSize: size, page: 1 }),
          }))}
        />
      </Card>
    </div>
  );
}
