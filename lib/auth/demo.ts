// The public demo account (AD-43). It has a random, never-stored password, so the
// only way in is POST /api/auth/demo, and that route exists only when DEMO_LOGIN=true.

export const DEMO_USER = {
  email: "demo@acme.example",
  name: "Demo HR Manager",
} as const;

/** Read per call (not cached) so a deployment can switch it without a code change. */
export function demoLoginEnabled(
  source: Record<string, string | undefined> = process.env,
) {
  return source.DEMO_LOGIN === "true";
}
