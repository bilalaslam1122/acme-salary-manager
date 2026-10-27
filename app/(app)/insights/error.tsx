"use client";

import { RouteError } from "@/components/common/route-error";

export default function InsightsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError title="Couldn't load insights" error={error} reset={reset} />;
}
