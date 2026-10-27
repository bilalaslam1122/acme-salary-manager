import { z } from "zod";
import { emailSchema } from "./validation/common";

// Each consumer validates only what it needs: the proxy never needs DATABASE_URL and
// the seed never needs SESSION_SECRET.

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export const authEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(32, "Must be at least 32 characters"),
});

export const seedAdminEnvSchema = z.object({
  SEED_ADMIN_EMAIL: emailSchema,
  SEED_ADMIN_PASSWORD: z.string().min(12, "Must be at least 12 characters"),
  SEED_ADMIN_NAME: z.string().trim().min(1).default("HR Manager"),
});

export type Env = z.infer<typeof envSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type SeedAdminEnv = z.infer<typeof seedAdminEnvSchema>;

type Source = Record<string, string | undefined>;

function parseWith<S extends z.ZodType>(schema: S, source: Source): z.output<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  return result.data;
}

export const parseEnv = (source: Source): Env => parseWith(envSchema, source);
export const parseAuthEnv = (source: Source): AuthEnv => parseWith(authEnvSchema, source);
export const parseSeedAdminEnv = (source: Source): SeedAdminEnv =>
  parseWith(seedAdminEnvSchema, source);

let cached: Env | undefined;
let cachedAuth: AuthEnv | undefined;

/** Validated environment. Parsed lazily so importing this module never throws. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

export function authEnv(): AuthEnv {
  cachedAuth ??= parseAuthEnv(process.env);
  return cachedAuth;
}
