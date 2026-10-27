"use client";

import { LoaderCircle } from "lucide-react";
import { useId, useState, type SubmitEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { minorToMajorInput, parseMajorToMinor } from "@/lib/money/parse";
import type { EmployeeDto } from "@/lib/services/employees";
import type { ReferenceData } from "@/lib/services/reference";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validation/employee";
import { zodFieldErrors } from "@/lib/validation/field-errors";

type FieldErrors = Record<string, string>;

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId: string;
  countryCode: string;
  salary: string;
  hireDate: string;
  salaryChangeReason: string;
}

interface EmployeeFormProps {
  reference: ReferenceData;
  /** Omit to create a new employee. */
  employee?: EmployeeDto;
  onSuccess: (employee: EmployeeDto) => void;
  onCancel?: () => void;
}

function initialValues(employee?: EmployeeDto): FormValues {
  return {
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    jobTitle: employee?.jobTitle ?? "",
    departmentId: employee ? String(employee.department.id) : "",
    countryCode: employee?.country.code ?? "",
    salary: employee
      ? minorToMajorInput(employee.salary.amountMinor, employee.salary.exponent)
      : "",
    hireDate: employee?.hireDate ?? "",
    salaryChangeReason: "",
  };
}

/**
 * Create/edit form. Validates with the API's Zod schemas before sending, then shows
 * any server field errors (e.g. duplicate email) inline on the same fields.
 */
export function EmployeeForm({
  reference,
  employee,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const isEdit = employee !== undefined;
  const [values, setValues] = useState<FormValues>(() => initialValues(employee));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const country = reference.countries.find((c) => c.code === values.countryCode);
  const exponent = country?.currencyExponent ?? 2;
  const salaryMinor = parseMajorToMinor(values.salary, exponent);
  const salaryChanged =
    isEdit &&
    (values.countryCode !== employee.country.code ||
      salaryMinor !== employee.salary.amountMinor);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  /** The request body, or field errors if client-side validation fails. */
  function buildPayload(): { body: unknown } | { errors: FieldErrors } {
    if (values.salary.trim() !== "" && salaryMinor === null) {
      return {
        errors: {
          salaryMinor:
            exponent === 0
              ? "Enter a whole amount, e.g. 9000000"
              : "Enter an amount like 85,000 or 85,000.50",
        },
      };
    }

    const full = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      jobTitle: values.jobTitle,
      departmentId: values.departmentId ? Number(values.departmentId) : undefined,
      countryCode: values.countryCode || undefined,
      salaryMinor: salaryMinor ?? undefined,
      hireDate: values.hireDate,
    };

    if (!isEdit) {
      const result = createEmployeeSchema.safeParse(full);
      return result.success ? { body: full } : { errors: zodFieldErrors(result.error) };
    }

    const original = initialValues(employee);
    const changes: Record<string, unknown> = {};
    for (const key of [
      "firstName",
      "lastName",
      "email",
      "jobTitle",
      "hireDate",
    ] as const) {
      if (values[key] !== original[key]) changes[key] = full[key];
    }
    if (values.departmentId !== original.departmentId) {
      changes.departmentId = full.departmentId;
    }
    if (values.countryCode !== original.countryCode)
      changes.countryCode = full.countryCode;
    if (salaryChanged) changes.salaryMinor = full.salaryMinor;
    if (salaryChanged && values.salaryChangeReason.trim()) {
      changes.salaryChangeReason = values.salaryChangeReason;
    }

    if (Object.keys(changes).length === 0)
      return { errors: { _root: "No changes to save." } };
    const result = updateEmployeeSchema.safeParse(changes);
    return result.success ? { body: changes } : { errors: zodFieldErrors(result.error) };
  }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const payload = buildPayload();
    if ("errors" in payload) {
      const { _root, ...fieldErrors } = payload.errors;
      setErrors(fieldErrors);
      setFormError(_root ?? null);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const response = await fetch(
        isEdit ? `/api/employees/${employee.id}` : "/api/employees",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload.body),
        },
      );
      const body = await response.json().catch(() => null);
      if (response.ok) {
        onSuccess(body.data as EmployeeDto);
        return;
      }
      applyServerError(response.status, body);
    } catch {
      setFormError("Could not reach the server. Your changes are still here; try again.");
    }
    setPending(false);
  }

  function applyServerError(status: number, body: unknown) {
    const error = isRecord(body) && isRecord(body.error) ? body.error : null;
    const fieldErrors = extractFieldErrors(error?.details);
    if (status === 401) {
      setFormError("Your session has expired. Sign in again to save.");
    } else if (fieldErrors) {
      setErrors(fieldErrors);
    } else {
      setFormError(
        typeof error?.message === "string"
          ? error.message
          : "Something went wrong. Try again.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" error={errors.firstName}>
          {(props) => (
            <Input
              {...props}
              value={values.firstName}
              onChange={(e) => set("firstName", e.target.value)}
            />
          )}
        </Field>
        <Field label="Last name" error={errors.lastName}>
          {(props) => (
            <Input
              {...props}
              value={values.lastName}
              onChange={(e) => set("lastName", e.target.value)}
            />
          )}
        </Field>
      </div>

      <Field label="Email" error={errors.email}>
        {(props) => (
          <Input
            {...props}
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        )}
      </Field>

      <Field label="Job title" error={errors.jobTitle}>
        {(props) => (
          <>
            <Input
              {...props}
              list="job-title-options"
              value={values.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
            />
            <datalist id="job-title-options">
              {reference.jobTitles.map((title) => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Department" error={errors.departmentId}>
          {(props) => (
            <NativeSelect
              {...props}
              value={values.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
            >
              <NativeSelectOption value="">Select…</NativeSelectOption>
              {reference.departments.map((d) => (
                <NativeSelectOption key={d.id} value={String(d.id)}>
                  {d.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Field label="Country" error={errors.countryCode}>
          {(props) => (
            <NativeSelect
              {...props}
              value={values.countryCode}
              onChange={(e) => set("countryCode", e.target.value)}
            >
              <NativeSelectOption value="">Select…</NativeSelectOption>
              {reference.countries.map((c) => (
                <NativeSelectOption key={c.code} value={c.code}>
                  {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </Field>
      </div>

      <Field label="Annual salary" error={errors.salaryMinor}>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              inputMode="decimal"
              className="pr-14 tabular-nums"
              value={values.salary}
              onChange={(e) => set("salary", e.target.value)}
            />
            <span
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground"
              data-testid="salary-currency"
            >
              {country?.currencyCode ?? "—"}
            </span>
          </div>
        )}
      </Field>

      {isEdit && values.countryCode !== employee.country.code && (
        <p className="text-xs text-muted-foreground">
          Changing country changes the salary currency to {country?.currencyCode}. Enter
          the new salary in {country?.currencyCode}.
        </p>
      )}

      {salaryChanged && (
        <Field label="Reason for change (optional)" error={errors.salaryChangeReason}>
          {(props) => (
            <Input
              {...props}
              placeholder="e.g. Annual review, Promotion"
              value={values.salaryChangeReason}
              onChange={(e) => set("salaryChangeReason", e.target.value)}
            />
          )}
        </Field>
      )}

      <Field label="Hire date" error={errors.hireDate}>
        {(props) => (
          <Input
            {...props}
            type="date"
            value={values.hireDate}
            onChange={(e) => set("hireDate", e.target.value)}
          />
        )}
      </Field>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          {isEdit ? "Save changes" : "Add employee"}
        </Button>
      </div>
    </form>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Field errors from an API error body: 400s nest them under `details.fieldErrors`,
 * 409s put them directly in `details`. Only string messages are kept.
 */
function extractFieldErrors(details: unknown): FieldErrors | null {
  if (!isRecord(details)) return null;
  const source = isRecord(details.fieldErrors) ? details.fieldErrors : details;
  const entries = Object.entries(source).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
