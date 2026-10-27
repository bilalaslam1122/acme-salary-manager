"use client";

import { UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employmentChangeSchema } from "@/lib/validation/employee";

export type EmploymentAction = "terminate" | "reinstate";

const COPY: Record<
  EmploymentAction,
  {
    label: string;
    title: (name: string) => string;
    description: string;
    placeholder: string;
    done: (name: string) => string;
    conflict: (name: string) => string;
  }
> = {
  terminate: {
    label: "Terminate",
    title: (name) => `Terminate ${name}?`,
    description:
      "They will move to the terminated list and be excluded from insights. Their salary history is kept, and they can be reinstated later.",
    placeholder: "e.g. Resigned",
    done: (name) => `${name} terminated`,
    conflict: (name) => `${name} is already terminated.`,
  },
  reinstate: {
    label: "Reinstate",
    title: (name) => `Reinstate ${name}?`,
    description:
      "They will become active again, appear in the directory and count in insights.",
    placeholder: "e.g. Terminated by mistake",
    done: (name) => `${name} reinstated`,
    conflict: (name) => `${name} is already active.`,
  },
};

/** Terminate or reinstate after confirmation. The reason is stored in the audit trail. */
export function EmploymentActionButton({
  action,
  employeeId,
  name,
}: {
  action: EmploymentAction;
  employeeId: number;
  name: string;
}) {
  const router = useRouter();
  const copy = COPY[action];
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setReason("");
      setError(undefined);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = employmentChangeSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        toast.success(copy.done(name));
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(
          response.status === 409
            ? copy.conflict(name)
            : `Could not ${action}. Try again.`,
        );
      }
    } catch {
      toast.error("Could not reach the server. Try again.");
    }
    setPending(false);
  }

  const Icon = action === "terminate" ? UserX : UserCheck;
  const inputId = `${action}-reason`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Icon className="h-4 w-4" aria-hidden />
          {copy.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title(name)}</AlertDialogTitle>
            <AlertDialogDescription>{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={inputId}>Reason</Label>
            <Input
              id={inputId}
              value={reason}
              placeholder={copy.placeholder}
              maxLength={500}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
              onChange={(event) => setReason(event.target.value)}
            />
            {error && (
              <p id={`${inputId}-error`} className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="submit"
              variant={action === "terminate" ? "destructive" : "default"}
              disabled={pending}
            >
              {copy.label}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
