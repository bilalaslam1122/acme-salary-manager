"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Route-level error card: short message and "Try again"; never raw errors (ui-context.md). */
export function RouteError({ title, reset }: { title: string; reset: () => void }) {
  return (
    <Card className="items-center gap-3 rounded-lg px-6 py-16 text-center">
      <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading this page.
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
