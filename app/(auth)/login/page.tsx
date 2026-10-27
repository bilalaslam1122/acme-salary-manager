import type { Metadata } from "next";
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
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">ACME Salary Manager</CardTitle>
          <CardDescription>Sign in with your HR Manager account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
