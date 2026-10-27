"use client";

import { ChartColumn, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/insights", label: "Insights", icon: ChartColumn },
] as const;

/**
 * Nav with the active item highlighted. usePathname() is URL data, so on dynamic
 * routes this must render inside <Suspense>; NavLinksView is the static fallback.
 */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

export function NavLinksView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
