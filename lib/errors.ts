/** Base class for expected business errors; mapped to HTTP in lib/http/handle.ts. */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
}

/** A business rule rejected otherwise well-formed input. `details` maps field → message. */
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";

  constructor(
    message: string,
    readonly fieldErrors: Record<string, string>,
  ) {
    super(message, fieldErrors);
  }
}
