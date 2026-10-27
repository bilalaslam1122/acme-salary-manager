"use client";

import { UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Soft-deletes after confirmation; the employee becomes read-only (open question 10). */
export function TerminateButton({
  employeeId,
  name,
}: {
  employeeId: number;
  name: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function terminate() {
    setPending(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success(`${name} terminated`);
        router.refresh();
      } else {
        toast.error(
          response.status === 409
            ? `${name} is already terminated.`
            : "Could not terminate. Try again.",
        );
      }
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
    setPending(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={pending}>
          <UserX className="h-4 w-4" aria-hidden />
          Terminate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terminate {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They will be hidden from the directory and excluded from insights. Their
            salary history is kept. Terminated employees can&apos;t be edited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={terminate}>
            Terminate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
