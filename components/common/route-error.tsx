"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Route-level error card: short message and "Try again"; never raw errors
 * (ui-context.md). The digest is Next's opaque server-error id, which matches the
 * server log entry, so it is safe to show and useful to report.
 */
export function RouteError({
  title,
  error,
  reset,
}: {
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card role="alert" className="items-center gap-3 rounded-lg px-6 py-16 text-center">
      <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading this page.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
