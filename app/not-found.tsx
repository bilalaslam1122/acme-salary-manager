import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Unknown URLs: a branded page with a way back instead of the default 404. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-xl">
        <EmptyState
          icon={Compass}
          title="This page doesn't exist."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/employees">Go to employees</Link>
            </Button>
          }
        />
      </Card>
    </main>
  );
}
