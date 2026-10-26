import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ConflictError, DomainError, NotFoundError, ValidationError } from "@/lib/errors";

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function json<T>(data: T, status = 200): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status },
  );
}

/** Parses input with a Zod schema; throws a 400-mapped error on failure. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new RequestValidationError(result.error);
  }
  return result.data;
}

/** Reads a JSON body; malformed JSON becomes a 400, not a 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new RequestValidationError(
      new z.ZodError([
        {
          code: "custom",
          path: [],
          message: "Body must be valid JSON",
          input: undefined,
        },
      ]),
    );
  }
}

class RequestValidationError extends Error {
  constructor(readonly zodError: z.ZodError) {
    super("Invalid request");
  }
}

/** Maps any thrown error to the standard `{ error }` response (code-standards.md). */
export function toErrorResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof RequestValidationError) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request", {
      fieldErrors: fieldErrorsFrom(error.zodError),
    });
  }
  if (error instanceof ValidationError) {
    return errorResponse(400, error.code, error.message, {
      fieldErrors: error.fieldErrors,
    });
  }
  if (error instanceof NotFoundError) {
    return errorResponse(404, error.code, error.message);
  }
  if (error instanceof ConflictError) {
    return errorResponse(409, error.code, error.message, error.details);
  }
  if (error instanceof DomainError) {
    return errorResponse(400, error.code, error.message);
  }
  console.error(error);
  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong");
}

/**
 * Wraps a route handler so every application failure goes through `toErrorResponse`.
 * Next.js control-flow errors (prerender bail-out on `request.url`/`cookies()`,
 * `notFound()`, `redirect()`) are rethrown so Next can handle them.
 */
export function handle<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      unstable_rethrow(error);
      return toErrorResponse(error);
    }
  };
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}
