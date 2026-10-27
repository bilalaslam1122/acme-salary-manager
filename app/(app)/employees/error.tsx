"use client";

import { RouteError } from "@/components/common/route-error";

export default function EmployeesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError title="Couldn't load employees" error={error} reset={reset} />;
}
