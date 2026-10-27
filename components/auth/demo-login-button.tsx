"use client";

import { LoaderCircle, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth/safe-next-path";

/** One click into the shared demo account; no credentials to hand out (AD-43). */
export function DemoLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInAsDemo() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      if (response.ok) {
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(safeNextPath(next));
        router.refresh();
        return;
      }
      setError("The demo account is not available right now.");
    } catch {
      setError("Could not reach the server. Try again.");
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={signInAsDemo} disabled={pending}>
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <PlayCircle className="h-4 w-4" aria-hidden />
        )}
        Explore the live demo
      </Button>
      <p className="text-xs text-muted-foreground">
        Signs you in as a demo HR Manager. The 10,000 employees are generated sample data,
        shared by every visitor, and may be reset at any time.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
