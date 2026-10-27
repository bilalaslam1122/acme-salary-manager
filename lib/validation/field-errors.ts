import type { z } from "zod";

/** First message per field path, keyed like the API's `details.fieldErrors`. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}
