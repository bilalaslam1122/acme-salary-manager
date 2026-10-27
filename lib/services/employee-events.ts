import "server-only";
import { prisma } from "@/lib/db/client";
import type { EmployeeEventType } from "@/lib/db/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import type { EmployeeChanges } from "./employee-changes";

export interface EmployeeEventDto {
  id: number;
  type: EmployeeEventType;
  changedAt: string;
  /** UPDATED only. */
  changes: EmployeeChanges | null;
  reason: string | null;
  /** Null for system changes (seed/import). */
  changedBy: { id: number; name: string } | null;
}

/**
 * Non-salary audit trail for one employee, newest first. An employee accumulates a
 * handful of these over years, so the list is returned whole rather than paged.
 */
export async function listEmployeeEvents(
  employeeId: number,
): Promise<EmployeeEventDto[]> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });
  if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);

  const rows = await prisma.employeeEvent.findMany({
    where: { employeeId },
    orderBy: [{ changedAt: "desc" }, { id: "desc" }],
    include: { changedBy: { select: { id: true, name: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    changedAt: row.changedAt.toISOString(),
    changes: (row.changes as EmployeeChanges | null) ?? null,
    reason: row.reason,
    changedBy: row.changedBy,
  }));
}
