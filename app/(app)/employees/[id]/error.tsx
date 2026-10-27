"use client";

import { RouteError } from "@/components/common/route-error";

export default function EmployeeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError title="Couldn't load this employee" error={error} reset={reset} />;
}
