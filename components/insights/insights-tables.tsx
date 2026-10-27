import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HistogramRow } from "@/lib/insights/chart-data";
import { formatUsdCents } from "@/lib/money/format";
import type { GroupSalaryStats } from "@/lib/services/insights";

const count = new Intl.NumberFormat("en-US");
const usd = (cents: number | null) => (cents === null ? "—" : formatUsdCents(cents));

/** Full stats per group: the chart shows the median; the table carries min/avg/max. */
export function GroupStatsTable({
  groups,
  groupLabel,
}: {
  groups: GroupSalaryStats[];
  groupLabel: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{groupLabel}</TableHead>
          <TableHead className="text-right">Headcount</TableHead>
          <TableHead className="text-right">Min</TableHead>
          <TableHead className="text-right">Median</TableHead>
          <TableHead className="text-right">Average</TableHead>
          <TableHead className="text-right">Max</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <TableRow key={group.key}>
            <TableCell className="font-medium">{group.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {count.format(group.headcount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {usd(group.minUsdCents)}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {usd(group.medianUsdCents)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {usd(group.avgUsdCents)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {usd(group.maxUsdCents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function HeadcountTable({ groups }: { groups: GroupSalaryStats[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Headcount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <TableRow key={group.key}>
            <TableCell>{group.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {count.format(group.headcount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function HistogramTable({ rows }: { rows: HistogramRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Salary (USD)</TableHead>
          <TableHead className="text-right">Employees</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.range}>
            <TableCell className="tabular-nums">{row.range}</TableCell>
            <TableCell className="text-right tabular-nums">
              {count.format(row.count)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Native disclosure: the table twin of a chart, reachable without hovering or JS. */
export function TableView({ children }: { children: ReactNode }) {
  return (
    <details className="group border-t">
      <summary className="cursor-pointer px-4 py-3 text-sm text-muted-foreground select-none hover:text-foreground">
        View as table
      </summary>
      {children}
    </details>
  );
}
