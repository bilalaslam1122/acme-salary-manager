"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
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
