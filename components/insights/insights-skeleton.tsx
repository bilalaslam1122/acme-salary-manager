import { Skeleton } from "@/components/ui/skeleton";

/** Matches the dashboard grid so nothing jumps when data streams in. */
export function InsightsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading insights">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
