"use client";

import { RouteError } from "@/components/common/route-error";

export default function EmployeesError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError title="Couldn't load employees" reset={reset} />;
}
