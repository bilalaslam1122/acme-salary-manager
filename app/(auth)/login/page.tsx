import type { Metadata } from "next";
import { demoLoginEnabled } from "@/lib/auth/demo";
import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in · ACME Salary Manager" };

export default function LoginPage() {
  // Read at build/prerender time; changing DEMO_LOGIN needs a redeploy.
  const demo = demoLoginEnabled();
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">ACME Salary Manager</CardTitle>
          <CardDescription>Sign in with your HR Manager account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {demo && (
            <>
              <DemoLoginButton />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" aria-hidden />
                or sign in with your account
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>
            </>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
