import { Card } from "@/components/ui/card";
import { formatUsdCents } from "@/lib/money/format";
import type { SalaryStats } from "@/lib/services/insights";

const count = new Intl.NumberFormat("en-US");

/**
 * KPI row: the headline numbers are figures, not charts. Values use proportional
 * figures (no tabular-nums at display size) and text tokens, never the chart hue.
 */
export function StatTiles({ stats }: { stats: SalaryStats }) {
  const usd = (cents: number | null) => (cents === null ? "—" : formatUsdCents(cents));
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Tile label="Headcount" value={count.format(stats.headcount)} />
      <Tile label="Median salary" value={usd(stats.medianUsdCents)} />
      <Tile label="Average salary" value={usd(stats.avgUsdCents)} />
      <Tile
        label="Salary range"
        value={
          stats.minUsdCents === null || stats.maxUsdCents === null
            ? "—"
            : `${usd(stats.minUsdCents)} – ${usd(stats.maxUsdCents)}`
        }
        compact
      />
    </div>
  );
}

function Tile({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <Card className="gap-1 rounded-lg px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={compact ? "text-lg font-semibold" : "text-2xl font-semibold"}>
        {value}
      </p>
    </Card>
  );
}
