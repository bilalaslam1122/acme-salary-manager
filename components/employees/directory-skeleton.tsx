import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Matches the directory layout so the page doesn't jump when data arrives. */
export function DirectorySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading employees">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 min-w-56 flex-1" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Card className="gap-0 overflow-hidden rounded-lg py-0">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </Card>
    </div>
  );
}
