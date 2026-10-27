import "server-only";
import { prisma } from "@/lib/db/client";
import { queryActiveFx, queryEmployeeSalaryUsdCents, type ActiveFx } from "@/lib/db/fx";
import { Prisma } from "@/lib/db/generated/prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import type {
  CreateEmployeeInput,
  EmploymentChangeInput,
  UpdateEmployeeInput,
} from "@/lib/validation/employee";
import { diffEmployee } from "./employee-changes";

type Tx = Prisma.TransactionClient;

export interface ActorContext {
  /** Signed-in user making the change; null for system changes. */
  actorId: number | null;
  /** Injected for deterministic tests. */
  now?: Date;
}

const employeeInclude = {
  department: true,
  country: true,
} satisfies Prisma.EmployeeInclude;

type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>;

export interface EmployeeDto {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: { id: number; name: string };
  country: { code: string; name: string };
  salary: { amountMinor: number; currency: string; exponent: number };
  hireDate: string;
  terminatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toEmployeeDto(row: EmployeeRow): EmployeeDto {
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    jobTitle: row.jobTitle,
    department: { id: row.department.id, name: row.department.name },
    country: { code: row.country.code, name: row.country.name },
    salary: {
      amountMinor: row.salaryMinor,
      currency: row.salaryCurrency,
      exponent: row.country.currencyExponent,
    },
    hireDate: row.hireDate.toISOString().slice(0, 10),
    terminatedAt: row.terminatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function formatEmployeeCode(id: number): string {
  return `ACME-${String(id).padStart(5, "0")}`;
}

export async function getEmployee(id: number): Promise<EmployeeDto> {
  const row = await prisma.employee.findUnique({
    where: { id },
    include: employeeInclude,
  });
  if (!row) throw new NotFoundError(`Employee ${id} not found`);
  return toEmployeeDto(row);
}

export interface EmployeeDetail {
  employee: EmployeeDto;
  /** Current salary at the active FX version; null if the currency has no rate. */
  salaryUsdCents: number | null;
  fx: ActiveFx | null;
}

/** Employee plus USD-normalized salary for the detail page. */
export async function getEmployeeDetail(id: number): Promise<EmployeeDetail> {
  const [employee, salaryUsdCents, fx] = await Promise.all([
    getEmployee(id),
    queryEmployeeSalaryUsdCents(id),
    queryActiveFx(),
  ]);
  return { employee, salaryUsdCents, fx };
}

/** Creates an employee and their initial SalaryHistory row atomically. */
export async function createEmployee(
  input: CreateEmployeeInput,
  { actorId, now = new Date() }: ActorContext,
): Promise<EmployeeDto> {
  return withUniqueEmail(() =>
    prisma.$transaction(async (tx) => {
      const { country } = await loadReferences(tx, input);
      const [next] = await tx.$queryRaw<{ id: number }[]>`
        SELECT nextval(pg_get_serial_sequence('employees', 'id'))::int AS id`;
      const id = next!.id;

      const row = await tx.employee.create({
        data: {
          id,
          employeeCode: formatEmployeeCode(id),
          ...input,
          salaryCurrency: country!.currencyCode,
        },
        include: employeeInclude,
      });

      await tx.salaryHistory.create({
        data: {
          employeeId: id,
          oldSalaryMinor: null,
          oldCurrency: null,
          newSalaryMinor: row.salaryMinor,
          currency: row.salaryCurrency,
          reason: "Initial salary",
          changedById: actorId,
          changedAt: now,
        },
      });

      return toEmployeeDto(row);
    }),
  );
}

/**
 * Updates an active employee. A change of salary amount or currency writes a
 * SalaryHistory row in the same transaction (Invariant 5).
 */
export async function updateEmployee(
  id: number,
  input: UpdateEmployeeInput,
  { actorId, now = new Date() }: ActorContext,
): Promise<EmployeeDto> {
  const { salaryChangeReason, ...fields } = input;

  return withUniqueEmail(() =>
    prisma.$transaction(async (tx) => {
      const existing = await lockActiveEmployee(tx, id);
      const { country } = await loadReferences(tx, fields);

      const currency = country?.currencyCode ?? existing.salaryCurrency;
      const newSalary = fields.salaryMinor ?? existing.salaryMinor;
      const salaryChanged =
        newSalary !== existing.salaryMinor || currency !== existing.salaryCurrency;

      if (salaryChangeReason !== undefined && !salaryChanged) {
        throw new ValidationError("Invalid employee update", {
          salaryChangeReason: "Only allowed when the salary changes",
        });
      }

      const row = await tx.employee.update({
        where: { id },
        data: { ...fields, salaryCurrency: currency },
        include: employeeInclude,
      });

      const changes = diffEmployee(toEmployeeDto(existing), toEmployeeDto(row));
      if (Object.keys(changes).length > 0) {
        await tx.employeeEvent.create({
          data: {
            employeeId: id,
            type: "UPDATED",
            changes,
            changedById: actorId,
            changedAt: now,
          },
        });
      }

      if (salaryChanged) {
        await tx.salaryHistory.create({
          data: {
            employeeId: id,
            oldSalaryMinor: existing.salaryMinor,
            oldCurrency: existing.salaryCurrency,
            newSalaryMinor: newSalary,
            currency,
            reason: salaryChangeReason ?? null,
            changedById: actorId,
            changedAt: now,
          },
        });
      }

      return toEmployeeDto(row);
    }),
  );
}

/** Soft-deletes an active employee; their history is kept (Invariant 10). */
export async function terminateEmployee(
  id: number,
  { reason }: EmploymentChangeInput,
  { actorId, now = new Date() }: ActorContext,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockActiveEmployee(tx, id);
    await tx.employee.update({ where: { id }, data: { terminatedAt: now } });
    await tx.employeeEvent.create({
      data: {
        employeeId: id,
        type: "TERMINATED",
        reason,
        changedById: actorId,
        changedAt: now,
      },
    });
  });
}

/** Undoes a termination, e.g. one made by mistake or a rehire into the same record. */
export async function reinstateEmployee(
  id: number,
  { reason }: EmploymentChangeInput,
  { actorId, now = new Date() }: ActorContext,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await lockEmployee(tx, id);
    if (!existing.terminatedAt) {
      throw new ConflictError(`Employee ${id} is not terminated`);
    }
    await tx.employee.update({ where: { id }, data: { terminatedAt: null } });
    await tx.employeeEvent.create({
      data: {
        employeeId: id,
        type: "REINSTATED",
        reason,
        changedById: actorId,
        changedAt: now,
      },
    });
  });
}

/** Row-locks the employee so concurrent edits record a correct "before" state. */
async function lockEmployee(tx: Tx, id: number): Promise<EmployeeRow> {
  const [locked] = await tx.$queryRaw<{ id: number }[]>`
    SELECT id FROM employees WHERE id = ${id} FOR UPDATE`;
  if (!locked) throw new NotFoundError(`Employee ${id} not found`);
  return tx.employee.findUniqueOrThrow({ where: { id }, include: employeeInclude });
}

async function lockActiveEmployee(tx: Tx, id: number): Promise<EmployeeRow> {
  const existing = await lockEmployee(tx, id);
  if (existing.terminatedAt) {
    throw new ConflictError(`Employee ${id} is terminated and cannot be changed`);
  }
  return existing;
}

async function loadReferences(
  tx: Tx,
  input: { departmentId?: number; countryCode?: string },
) {
  // Sequential: an interactive transaction runs on a single connection.
  const department =
    input.departmentId === undefined
      ? null
      : await tx.department.findUnique({ where: { id: input.departmentId } });
  const country =
    input.countryCode === undefined
      ? null
      : await tx.country.findUnique({ where: { code: input.countryCode } });

  const fieldErrors: Record<string, string> = {};
  if (input.departmentId !== undefined && !department) {
    fieldErrors.departmentId = "Unknown department";
  }
  if (input.countryCode !== undefined && !country) {
    fieldErrors.countryCode = "Unknown country";
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("Invalid employee references", fieldErrors);
  }
  return { department, country };
}

async function withUniqueEmail<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("An employee with this email already exists", {
        email: "Already in use",
      });
    }
    throw error;
  }
}
