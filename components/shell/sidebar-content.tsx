import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavLinks } from "./nav-links";
import { UserBlock } from "./user-block";

export function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-3 pt-2">
        <p className="text-base font-semibold">ACME</p>
        <p className="text-xs text-muted-foreground">Salary Manager</p>
      </div>
      <NavLinks />
      <div className="mt-auto border-t pt-4">
        <Suspense fallback={<Skeleton className="h-9 w-full" />}>
          <UserBlock />
        </Suspense>
      </div>
    </div>
  );
}
