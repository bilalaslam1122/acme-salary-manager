"use client";

import { RouteError } from "@/components/common/route-error";

export default function InsightsError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError title="Couldn't load insights" reset={reset} />;
}
