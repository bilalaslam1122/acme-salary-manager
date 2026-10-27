import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Centered icon, one-line explanation and one action (ui-context.md, States). */
export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{title}</p>
      {action}
    </div>
  );
}
