import { UserSearch } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function EmployeeNotFound() {
  return (
    <Card className="rounded-lg">
      <EmptyState
        icon={UserSearch}
        title="This employee doesn't exist."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/employees">Back to employees</Link>
          </Button>
        }
      />
    </Card>
  );
}
