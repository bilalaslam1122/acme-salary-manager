"use client";

import { Menu } from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/** Below 1024px the sidebar collapses into a sheet (ui-context.md). */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Children are server-rendered, so links can't take a callback. Close on any link
  // click via delegation instead of watching usePathname(), which would force this
  // component under <Suspense> on dynamic routes.
  function closeOnLinkClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation">
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="h-full" onClick={closeOnLinkClick}>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
