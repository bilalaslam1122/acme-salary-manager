import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pagination } from "@/components/common/pagination";
import { EmployeeEventsList } from "@/components/employees/employee-events-list";
import { EmployeeSheet } from "@/components/employees/employee-sheet";
import { EmploymentActionButton } from "@/components/employees/employment-action-button";
import { SalaryHistoryTable } from "@/components/employees/salary-history-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundError } from "@/lib/errors";
import { formatMoney, formatUsdCents } from "@/lib/money/format";
import { listEmployeeEvents } from "@/lib/services/employee-events";
import { getEmployeeDetail, type EmployeeDetail } from "@/lib/services/employees";
import { getReferenceData } from "@/lib/services/reference";
import { listSalaryHistory } from "@/lib/services/salary-history";
import { employeeIdSchema } from "@/lib/validation/employee";
import { paginationSchema } from "@/lib/validation/pagination";

export const metadata: Metadata = { title: "Employee · ACME Salary Manager" };

const HISTORY_PAGE_SIZE = 20;

export default function EmployeePage({
  params,
  searchParams,
}: PageProps<"/employees/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/employees"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Employees
      </Link>
      <Suspense fallback={<EmployeeSkeleton />}>
        <EmployeeDetailView params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EmployeeDetailView({
  params,
  searchParams,
}: Pick<PageProps<"/employees/[id]">, "params" | "searchParams">) {
  const idResult = employeeIdSchema.safeParse((await params).id);
  if (!idResult.success) notFound();
  const id = idResult.data;

  const rawPage = (await searchParams).historyPage;
  const historyQuery = paginationSchema.safeParse({
    page: Array.isArray(rawPage) ? rawPage[0] : rawPage,
    pageSize: HISTORY_PAGE_SIZE,
  });
  const pagination = historyQuery.success
    ? historyQuery.data
    : { page: 1, pageSize: HISTORY_PAGE_SIZE };

  let detail: EmployeeDetail;
  try {
    detail = await getEmployeeDetail(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const [history, events, reference] = await Promise.all([
    listSalaryHistory(id, pagination),
    listEmployeeEvents(id),
    getReferenceData(),
  ]);
  const { employee } = detail;
  const name = `${employee.firstName} ${employee.lastName}`;
  const terminated = employee.terminatedAt !== null;
  const termination = terminated
    ? events.find((e) => e.type === "TERMINATED")
    : undefined;

  return (
    <>
      <Card className="rounded-lg">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{name}</h1>
              {terminated && <Badge variant="secondary">Terminated</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{employee.employeeCode}</span> ·{" "}
              {employee.email}
            </p>
          </div>
          <div className="flex gap-2">
            {terminated ? (
              <EmploymentActionButton
                action="reinstate"
                employeeId={employee.id}
                name={name}
              />
            ) : (
              <>
                <EmployeeSheet reference={reference} employee={employee} />
                <EmploymentActionButton
                  action="terminate"
                  employeeId={employee.id}
                  name={name}
                />
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {terminated && (
            <p
              role="status"
              className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
            >
              Terminated on {employee.terminatedAt!.slice(0, 10)}
              {termination?.reason ? ` · ${termination.reason}` : ""}. This record is
              read-only; reinstate the employee to edit it.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-6">
            <Detail label="Job title" value={employee.jobTitle} />
            <Detail label="Department" value={employee.department.name} />
            <Detail label="Country" value={employee.country.name} />
            <Detail label="Hire date" value={employee.hireDate} />
            <Detail
              label="Salary"
              value={`${formatMoney(employee.salary.amountMinor, employee.salary.currency, employee.salary.exponent)} ${employee.salary.currency}`}
            />
            <Detail
              label={`Salary (USD${detail.fx ? `, FX ${detail.fx.version}` : ""})`}
              value={
                detail.salaryUsdCents === null
                  ? "—"
                  : formatUsdCents(detail.salaryUsdCents)
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Salary history
          </CardTitle>
        </CardHeader>
        <SalaryHistoryTable rows={history.data} />
        <Pagination
          page={history.meta.page}
          pageSize={history.meta.pageSize}
          total={history.meta.total}
          totalPages={history.meta.totalPages}
          hrefForPage={(page) =>
            page === 1 ? `/employees/${id}` : `/employees/${id}?historyPage=${page}`
          }
          itemLabel={{ singular: "change", plural: "changes" }}
          label="Salary history pages"
        />
      </Card>

      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Activity
          </CardTitle>
        </CardHeader>
        <EmployeeEventsList events={events} />
      </Card>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function EmployeeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading employee">
      <Skeleton className="h-36 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
