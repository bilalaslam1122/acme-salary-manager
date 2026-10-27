import { getCurrentSession } from "@/lib/auth/current-session";
import { SignOutButton } from "./sign-out-button";

/** Signed-in user's name and email with sign out. Reads cookies: render inside Suspense. */
export async function UserBlock() {
  const session = await getCurrentSession();
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{session?.name ?? "Signed out"}</p>
        <p className="truncate text-xs text-muted-foreground">{session?.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
