import { History } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money/format";
import type { Money, SalaryChangeDto } from "@/lib/services/salary-history";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const money = (value: Money) =>
  formatMoney(value.amountMinor, value.currency, value.exponent);

export function SalaryHistoryTable({ rows }: { rows: SalaryChangeDto[] }) {
  if (rows.length === 0) {
    return <EmptyState icon={History} title="No salary changes yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Previous</TableHead>
          <TableHead className="text-right">New</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Changed by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((change) => (
          <TableRow key={change.id}>
            <TableCell className="tabular-nums">
              {dateFormat.format(new Date(change.changedAt))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {change.oldSalary ? money(change.oldSalary) : "—"}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {money(change.newSalary)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <ChangeLabel change={change} />
            </TableCell>
            <TableCell>{change.reason ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {change.changedBy?.name ?? "System"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ChangeLabel({ change }: { change: SalaryChangeDto }) {
  if (!change.oldSalary) return <span className="text-muted-foreground">Initial</span>;
  if (change.oldSalary.currency !== change.newSalary.currency) {
    return (
      <span className="text-muted-foreground">
        {change.oldSalary.currency} → {change.newSalary.currency}
      </span>
    );
  }
  if (change.changePercent === null) return <span>—</span>;
  const sign = change.changePercent > 0 ? "+" : "";
  return (
    <span
      className={cn(
        change.changePercent > 0 && "text-success",
        change.changePercent < 0 && "text-destructive",
      )}
    >
      {sign}
      {change.changePercent.toFixed(1)}%
    </span>
  );
}
