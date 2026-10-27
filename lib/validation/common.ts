import { z } from "zod";

/**
 * Trims and lowercases *before* validating. `z.email().trim()` would validate the raw
 * string first and reject a pasted " hr@acme.example ".
 */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
