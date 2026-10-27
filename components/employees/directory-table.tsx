import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatUsdCents } from "@/lib/money/format";
import type { EmployeeListItem } from "@/lib/services/employee-directory";
import { sortHref } from "@/lib/validation/directory-url";
import type {
  EmployeeListQuery,
  EmployeeSortField,
} from "@/lib/validation/employee-list";

interface DirectoryTableProps {
  rows: EmployeeListItem[];
  query: EmployeeListQuery;
}

export function DirectoryTable({ rows, query }: DirectoryTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No employees match these filters."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/employees">Clear filters</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 bg-card">
        <TableRow>
          <SortableHead query={query} field="name" label="Name" />
          <TableHead>Code</TableHead>
          <SortableHead query={query} field="jobTitle" label="Job title" />
          <TableHead>Department</TableHead>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Salary</TableHead>
          <SortableHead
            query={query}
            field="salaryUsd"
            label="Salary (USD)"
            align="right"
          />
          <SortableHead query={query} field="hireDate" label="Hire date" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {employee.lastName}, {employee.firstName}
                </span>
                {employee.terminatedAt && <Badge variant="secondary">Terminated</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">{employee.email}</div>
            </TableCell>
            <TableCell className="font-mono text-xs">{employee.employeeCode}</TableCell>
            <TableCell>{employee.jobTitle}</TableCell>
            <TableCell>{employee.department.name}</TableCell>
            <TableCell>{employee.country.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(
                employee.salary.amountMinor,
                employee.salary.currency,
                employee.salary.exponent,
              )}
              <span className="ml-1 text-xs text-muted-foreground">
                {employee.salary.currency}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {employee.salaryUsdCents === null
                ? "—"
                : formatUsdCents(employee.salaryUsdCents)}
            </TableCell>
            <TableCell className="tabular-nums">{employee.hireDate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortableHead({
  query,
  field,
  label,
  align = "left",
}: {
  query: EmployeeListQuery;
  field: EmployeeSortField;
  label: string;
  align?: "left" | "right";
}) {
  const active = query.sort === field;
  const Icon = !active ? ArrowUpDown : query.order === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      aria-sort={active ? (query.order === "asc" ? "ascending" : "descending") : "none"}
      className={align === "right" ? "text-right" : undefined}
    >
      <Link
        href={sortHref(query, field)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <Icon
          className={active ? "h-4 w-4" : "h-4 w-4 text-muted-foreground/60"}
          aria-hidden
        />
      </Link>
    </TableHead>
  );
}
