"use client";

import { RouteError } from "@/components/common/route-error";

export default function EmployeeError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError title="Couldn't load this employee" reset={reset} />;
}
