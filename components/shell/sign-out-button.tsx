"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * A full page load, not a router navigation: Next's client router cache holds every
 * page visited while signed in, so a soft navigation would let Back show salary
 * data after sign-out. `replace` also drops the signed-in page from history.
 */
export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace("/login");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={signOut}
      disabled={pending}
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" aria-hidden />
    </Button>
  );
}
