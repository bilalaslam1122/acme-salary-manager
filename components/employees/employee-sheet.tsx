"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { EmployeeDto } from "@/lib/services/employees";
import type { ReferenceData } from "@/lib/services/reference";
import { EmployeeForm } from "./employee-form";

/** Right-side sheet (480px) hosting the create/edit form (ui-context.md). */
export function EmployeeSheet({
  reference,
  employee,
}: {
  reference: ReferenceData;
  employee?: EmployeeDto;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = employee !== undefined;

  function onSuccess(saved: EmployeeDto) {
    setOpen(false);
    if (isEdit) {
      toast.success("Employee updated");
      router.refresh();
    } else {
      toast.success(`${saved.firstName} ${saved.lastName} added`);
      router.push(`/employees/${saved.id}`);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEdit ? (
          <Button variant="outline">
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            Add employee
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto rounded-l-xl sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit employee" : "Add employee"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Salary changes are recorded in the employee's history."
              : "The salary is recorded as the employee's initial salary."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {/* Remount on open so a cancelled edit never leaks into the next one. */}
          {open && (
            <EmployeeForm
              reference={reference}
              employee={employee}
              onSuccess={onSuccess}
              onCancel={() => setOpen(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
