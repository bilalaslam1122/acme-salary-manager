import { InsightsSkeleton } from "@/components/insights/insights-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Insights</h1>
      <InsightsSkeleton />
    </div>
  );
}
