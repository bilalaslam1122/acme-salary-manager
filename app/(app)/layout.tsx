import type { ReactNode } from "react";
import { MobileNav } from "@/components/shell/mobile-nav";
import { SidebarContent } from "@/components/shell/sidebar-content";
import { Toaster } from "@/components/ui/sonner";

/** App shell for signed-in pages: fixed sidebar ≥1024px, sheet nav below (ui-context.md). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-card lg:block">
        <SidebarContent />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b bg-card px-4 lg:hidden">
          <MobileNav>
            <SidebarContent />
          </MobileNav>
          <span className="text-sm font-semibold">ACME Salary Manager</span>
        </header>
        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-6">{children}</main>
        {/* Light-only app: pin the theme instead of editing the protected wrapper. */}
        <Toaster theme="light" position="bottom-right" />
      </div>
    </div>
  );
}
